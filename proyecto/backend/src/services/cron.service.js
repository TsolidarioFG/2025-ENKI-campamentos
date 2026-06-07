import prisma from "../lib/prisma.js";
import { getGlobalInscriptionStatus } from "../controllers/signedUp.controller.js";
import cron from "node-cron";

export const cancelExpiredPendingSignedUpsLogic = async () => {
  const now = new Date();

  let settings = await prisma.appSettings.findUnique({
    where: { id: 1 },
  });

  if (!settings) {
    settings = await prisma.appSettings.create({
      data: {
        id: 1,
        pendingReservationHours: 48,
      },
    });
  }

  const expirationDate = new Date(
    now.getTime() - settings.pendingReservationHours * 60 * 60 * 1000
  );

  const basicPendingSignedUps = await prisma.signedUp.findMany({
    where: {
      state: "PENDING",
      createdAt: {
        lte: expirationDate,
      },
    },
  });

  if (basicPendingSignedUps.length === 0) {
    return {
      cancelledCount: 0,
      pendingReservationHours: settings.pendingReservationHours,
    };
  }

  const pendingSignedUps = await prisma.signedUp.findMany({
    where: {
      state: "PENDING",
      createdAt: {
        lte: expirationDate,
      },
    },
    include: {
      inscription: {
        include: {
          participant: true,
        },
      },
      week: true,
      paymentAllocations: {
        where: {
          purpose: "RESERVATION",
        },
        include: {
          payment: true,
        },
      },
    },
  });

  let cancelledCount = 0;

  await prisma.$transaction(async (tx) => {
    for (const signedUp of pendingSignedUps) {
      const reservationAllocations = signedUp.paymentAllocations || [];

      const reservationFullyPaid =
        reservationAllocations.length > 0 &&
        reservationAllocations.every(
          (allocation) => allocation.payment.status === "PAID"
        );

      if (reservationFullyPaid) continue;

      const hasDisability =
        signedUp.inscription.participant.hasDisability === true;

      const waitlistCount = await tx.signedUp.count({
        where: {
          weekId: signedUp.weekId,
          state: "WAITLIST",
        },
      });

      await tx.signedUp.update({
        where: {
          inscriptionId_weekId: {
            inscriptionId: signedUp.inscriptionId,
            weekId: signedUp.weekId,
          },
        },
        data: {
          state: "CANCELLED",
        },
      });

      if (waitlistCount === 0) {
        if (hasDisability) {
          await tx.week.update({
            where: { id: signedUp.weekId },
            data: {
              availableDisabilityPlaces:
                signedUp.week.availableDisabilityPlaces + 1,
            },
          });
        } else {
          await tx.week.update({
            where: { id: signedUp.weekId },
            data: {
              availablePlaces: signedUp.week.availablePlaces + 1,
            },
          });
        }
      }

      const updatedSignedUps = await tx.signedUp.findMany({
        where: {
          inscriptionId: signedUp.inscriptionId,
        },
      });

      const newGlobalStatus = getGlobalInscriptionStatus(
        updatedSignedUps.map((s) =>
          s.weekId === signedUp.weekId &&
          s.inscriptionId === signedUp.inscriptionId
            ? "CANCELLED"
            : s.state
        )
      );

      await tx.inscription.update({
        where: { id: signedUp.inscriptionId },
        data: {
          globalStatus: newGlobalStatus,
        },
      });

      cancelledCount++;
    }
  });

  return {
    cancelledCount,
    pendingReservationHours: settings.pendingReservationHours,
  };
};

export const startCronJobs = () => {
  cron.schedule("*/5 * * * *", async () => {
    try {
      console.log("Ejecutando limpieza de reservas caducadas...");

      const result = await cancelExpiredPendingSignedUpsLogic();

      if (result.skipped) {
        console.warn(
          "Limpieza de reservas omitida:",
          result.reason
        );
        return;
      }

      console.log(`Canceladas ${result.cancelledCount} reservas caducadas`);
    } catch (error) {
      console.error("Error en cron:", error);
    }
  });
};