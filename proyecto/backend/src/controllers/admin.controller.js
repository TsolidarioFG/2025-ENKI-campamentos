import prisma from "../lib/prisma.js";

export const getDashboard = async (req, res) => {
  try {
    const { summerCampId } = req.validatedParams;

    const camp = await prisma.summerCamp.findUnique({
      where: { id: summerCampId },
      include: {
        weeks: {
          orderBy: { number: "asc" },
        },
      },
    });

    if (!camp) {
      return res.status(404).json({
        error: "Campamento no encontrado",
      });
    }

    let totalParticipants = 0;
    let disabilityCount = 0;
    let nonDisabilityCount = 0;

    const weeksSummary = [];

    for (const week of camp.weeks) {
      const signedUps = await prisma.signedUp.findMany({
        where: { weekId: week.id },
        include: {
          inscription: {
            include: {
              participant: true,
            },
          },
        },
      });

      totalParticipants += signedUps.length;

      signedUps.forEach((s) => {
        if (s.inscription.participant.hasDisability) {
          disabilityCount++;
        } else {
          nonDisabilityCount++;
        }
      });

      weeksSummary.push({
        weekId: week.id,
        number: week.number,
        totalPlaces: week.totalPlaces,
        availablePlaces: week.availablePlaces,
        totalDisabilityPlaces: week.totalDisabilityPlaces,
        availableDisabilityPlaces: week.availableDisabilityPlaces,
        pending: signedUps.filter((s) => s.state === "PENDING").length,
        accepted: signedUps.filter((s) => s.state === "ACCEPTED").length,
        waitlist: signedUps.filter((s) => s.state === "WAITLIST").length,
        cancelled: signedUps.filter((s) => s.state === "CANCELLED").length,
      });
    }

    res.json({
      camp,
      stats: {
        totalParticipants,
        disabilityCount,
        nonDisabilityCount,
      },
      weeksSummary,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error dashboard" });
  }
};

export const getInscriptionsTable = async (req, res) => {
  try {
    const { accepted, waitlist } = req.validatedQuery;

    const inscriptions = await prisma.inscription.findMany({
      include: {
        participant: {
          include: {
            guardian: true,
          },
        },
        payments: true,
        signedUpWeeks: {
          include: {
            week: true,
          },
        },
      },
    });

    const result = inscriptions.map((i) => {
      const hasAccepted = i.signedUpWeeks.some(
        (s) => s.state === "ACCEPTED"
      );

      const hasWaitlist = i.signedUpWeeks.some(
        (s) => s.state === "WAITLIST"
      );

      return {
        id: i.id,
        participantName: i.participant.name,
        participantSurname: i.participant.surname,
        guardianName: i.participant.guardian?.name || null,
        guardianSurname: i.participant.guardian?.surname || null,
        phone: i.participant.guardian?.phone || null,
        email: i.participant.guardian?.email || null,
        totalPaid: i.totalAmountPaid,
        totalPending: i.totalAmountPending,
        accepted: hasAccepted,
        waitlist: hasWaitlist,
      };
    });

    const filtered = result.filter((r) => {
      if (accepted !== undefined && r.accepted !== accepted) return false;
      if (waitlist !== undefined && r.waitlist !== waitlist) return false;
      return true;
    });

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error tabla inscripciones" });
  }
};

export const getPendingPayments = async (req, res) => {
  try {
    const payments = await prisma.payment.findMany({
      where: {
        status: "PENDING",
      },
      include: {
        inscription: {
          include: {
            participant: true,
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    res.json(payments);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error pagos pendientes" });
  }
};

export const getDebtors = async (req, res) => {
  try {
    const inscriptions = await prisma.inscription.findMany({
      where: {
        totalAmountPending: {
          gt: 0,
        },
      },
      include: {
        participant: {
          include: {
            guardian: true,
          },
        },
        payments: true,
        signedUpWeeks: {
          include: {
            week: true,
          },
        },
      },
    });

    res.json(inscriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error deudores" });
  }
};