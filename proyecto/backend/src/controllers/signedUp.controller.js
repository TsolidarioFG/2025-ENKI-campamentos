import prisma from "../lib/prisma.js";
import { cancelExpiredPendingSignedUpsLogic } from "../services/cron.service.js";

const splitAmountInTwo = (amount) => {
  const first = Number((amount / 2).toFixed(2));
  const second = Number((amount - first).toFixed(2));
  return [first, second];
};

export const getGlobalInscriptionStatus = (states) => {
  if (states.length === 0) return "PENDING";

  const allAccepted = states.every((state) => state === "ACCEPTED");
  const allPending = states.every((state) => state === "PENDING");
  const allWaitlist = states.every((state) => state === "WAITLIST");
  const allCancelled = states.every((state) => state === "CANCELLED");

  if (allAccepted) return "ACCEPTED";
  if (allPending) return "PENDING";
  if (allWaitlist) return "WAITLIST";
  if (allCancelled) return "CANCELLED";

  if (states.includes("PENDING")) return "PENDING";

  return "PARTIALLY_ACCEPTED";
};

const createReservationPaymentsForSingleSignedUp = async ({
  tx,
  inscriptionId,
  paymentMode,
  signedUp,
}) => {
  if (paymentMode === "ONE_PAYMENT") {
    const payment = await tx.payment.create({
      data: {
        paymentType: "EXTRA",
        status: "PENDING",
        amount: signedUp.priceApplied,
        concept: `Pago reserva semana ${signedUp.week.number}`,
        isMandatory: true,
        inscriptionId,
      },
    });

    await tx.paymentSignedUp.create({
      data: {
        paymentId: payment.id,
        inscriptionId,
        weekId: signedUp.weekId,
        purpose: "RESERVATION",
        amount: signedUp.priceApplied,
      },
    });

    return;
  }

  if (paymentMode === "TWO_PAYMENTS") {
    const [firstAmount, secondAmount] = splitAmountInTwo(signedUp.priceApplied);

    const firstPayment = await tx.payment.create({
      data: {
        paymentType: "EXTRA",
        status: "PENDING",
        amount: firstAmount,
        concept: `Primer pago reserva semana ${signedUp.week.number}`,
        isMandatory: true,
        inscriptionId,
      },
    });

    const secondPayment = await tx.payment.create({
      data: {
        paymentType: "EXTRA",
        status: "PENDING",
        amount: secondAmount,
        concept: `Segundo pago reserva semana ${signedUp.week.number}`,
        isMandatory: true,
        inscriptionId,
      },
    });

    await tx.paymentSignedUp.create({
      data: {
        paymentId: firstPayment.id,
        inscriptionId,
        weekId: signedUp.weekId,
        purpose: "RESERVATION",
        amount: firstAmount,
      },
    });

    await tx.paymentSignedUp.create({
      data: {
        paymentId: secondPayment.id,
        inscriptionId,
        weekId: signedUp.weekId,
        purpose: "RESERVATION",
        amount: secondAmount,
      },
    });
  }
};

export const updateSignedUpStatus = async (req, res) => {
  try {
    const { inscriptionId, weekId } = req.validatedParams;
    const { newState, paymentModeForNewReservation } = req.validatedBody;

    const result = await prisma.$transaction(async (tx) => {
      const currentSignedUp = await tx.signedUp.findUnique({
        where: {
          inscriptionId_weekId: {
            inscriptionId,
            weekId,
          },
        },
        include: {
          inscription: {
            include: {
              participant: true,
              signedUpWeeks: {
                orderBy: {
                  createdAt: "asc",
                },
              },
            },
          },
          week: true,
          paymentAllocations: {
            include: {
              payment: true,
            },
          },
        },
      });

      if (!currentSignedUp) {
        throw new Error("La reserva semanal no existe");
      }

      const currentState = currentSignedUp.state;
      const hasDisability =
        currentSignedUp.inscription.participant.hasDisability === true;

      if (currentState === newState) {
        throw new Error("La reserva ya está en ese estado");
      }

      const allowedTransitions = {
        WAITLIST: ["PENDING", "CANCELLED"],
        PENDING: ["ACCEPTED", "CANCELLED"],
        ACCEPTED: [],
        CANCELLED: [],
      };

      if (!allowedTransitions[currentState].includes(newState)) {
        throw new Error(
          `No se permite cambiar de ${currentState} a ${newState}`
        );
      }

      if (currentState === "WAITLIST" && newState === "PENDING") {
        if (hasDisability) {
          if (currentSignedUp.week.availableDisabilityPlaces > 0) {
            await tx.week.update({
              where: { id: currentSignedUp.week.id },
              data: {
                availableDisabilityPlaces:
                  currentSignedUp.week.availableDisabilityPlaces - 1,
              },
            });
          } else {
            await tx.week.update({
              where: { id: currentSignedUp.week.id },
              data: {
                totalDisabilityPlaces:
                  currentSignedUp.week.totalDisabilityPlaces + 1,
              },
            });
          }
        } else {
          if (currentSignedUp.week.availablePlaces > 0) {
            await tx.week.update({
              where: { id: currentSignedUp.week.id },
              data: {
                availablePlaces: currentSignedUp.week.availablePlaces - 1,
              },
            });
          } else {
            await tx.week.update({
              where: { id: currentSignedUp.week.id },
              data: {
                totalPlaces: currentSignedUp.week.totalPlaces + 1,
              },
            });
          }
        }

        const effectivePaymentMode =
          paymentModeForNewReservation || currentSignedUp.inscription.paymentMode;

        await createReservationPaymentsForSingleSignedUp({
          tx,
          inscriptionId: currentSignedUp.inscriptionId,
          paymentMode: effectivePaymentMode,
          signedUp: currentSignedUp,
        });

        await tx.inscription.update({
          where: { id: currentSignedUp.inscriptionId },
          data: {
            totalAmountExpected:
              currentSignedUp.inscription.totalAmountExpected +
              currentSignedUp.priceApplied,
            totalAmountPending:
              currentSignedUp.inscription.totalAmountPending +
              currentSignedUp.priceApplied,
          },
        });
      }

      if (currentState === "PENDING" && newState === "CANCELLED") {
        if (hasDisability) {
          await tx.week.update({
            where: { id: currentSignedUp.week.id },
            data: {
              availableDisabilityPlaces:
                currentSignedUp.week.availableDisabilityPlaces + 1,
            },
          });
        } else {
          await tx.week.update({
            where: { id: currentSignedUp.week.id },
            data: {
              availablePlaces: currentSignedUp.week.availablePlaces + 1,
            },
          });
        }
      }

      await tx.signedUp.update({
        where: {
          inscriptionId_weekId: {
            inscriptionId,
            weekId,
          },
        },
        data: {
          state: newState,
        },
      });

      const updatedSignedUps = await tx.signedUp.findMany({
        where: {
          inscriptionId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const newGlobalStatus = getGlobalInscriptionStatus(
        updatedSignedUps.map((item) => item.state)
      );

      await tx.inscription.update({
        where: { id: inscriptionId },
        data: {
          globalStatus: newGlobalStatus,
        },
      });

      return tx.inscription.findUnique({
        where: { id: inscriptionId },
        include: {
          participant: true,
          signedUpWeeks: {
            include: {
              week: true,
              paymentAllocations: {
                include: {
                  payment: true,
                },
              },
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          payments: {
            include: {
              paymentAllocations: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
        },
      });
    });

    res.json({
      message: "Estado de la reserva actualizado correctamente",
      inscription: result,
    });
  } catch (error) {
    console.error("Error al actualizar el estado de la reserva:", error);
    res.status(500).json({
      error: error.message || "Error al actualizar el estado de la reserva",
    });
  }
};

export const getSignedUpsByWeek = async (req, res) => {
  try {
    const { weekId } = req.validatedParams;
    const {
      state,
      breakfast,
      lunch,
      earlyRise,
      hasDisability,
      accepted,
      waitlist,
    } = req.validatedQuery;

    const signedUps = await prisma.signedUp.findMany({
      where: {
        weekId,
      },
      include: {
        inscription: {
          include: {
            participant: {
              include: {
                guardian: true,
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    const filtered = signedUps.filter((s) => {
      if (state !== undefined && s.state !== state) {
        return false;
      }

      if (breakfast !== undefined && s.breakfast !== breakfast) {
        return false;
      }

      if (lunch !== undefined && s.lunch !== lunch) {
        return false;
      }

      if (earlyRise !== undefined && s.earlyRise !== earlyRise) {
        return false;
      }

      if (
        hasDisability !== undefined &&
        s.inscription.participant.hasDisability !== hasDisability
      ) {
        return false;
      }

      if (accepted === true && s.state !== "ACCEPTED") {
        return false;
      }

      if (waitlist === true && s.state !== "WAITLIST") {
        return false;
      }

      return true;
    });

    res.json(filtered);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error signedups week" });
  }
};

export const getWeekWaitlist = async (req, res) => {
  try {
    const { weekId } = req.validatedParams;

    const week = await prisma.week.findUnique({
      where: { id: weekId },
      include: {
        summerCamp: true,
      },
    });

    if (!week) {
      return res.status(404).json({
        error: "La semana no existe",
      });
    }

    const waitlist = await prisma.signedUp.findMany({
      where: {
        weekId,
        state: "WAITLIST",
      },
      orderBy: {
        createdAt: "asc",
      },
      include: {
        inscription: {
          include: {
            participant: {
              include: {
                guardian: true,
                address: true,
              },
            },
          },
        },
        week: {
          include: {
            summerCamp: true,
          },
        },
        paymentAllocations: {
          include: {
            payment: true,
          },
          orderBy: {
            createdAt: "asc",
          },
        },
      },
    });

    const formattedWaitlist = waitlist.map((item, index) => ({
      waitlistPosition: index + 1,
      ...item,
    }));

    res.json({
      week: {
        id: week.id,
        number: week.number,
        summerCampId: week.summerCampId,
        summerCampName: week.summerCamp?.name || null,
      },
      totalWaitlist: formattedWaitlist.length,
      waitlist: formattedWaitlist,
    });
  } catch (error) {
    console.error("Error al obtener la lista de espera:", error);
    res.status(500).json({
      error: "Error al obtener la lista de espera",
    });
  }
};

export const cancelExpiredPendingSignedUps = async (req, res) => {
  try {
    const result = await cancelExpiredPendingSignedUpsLogic();

    res.json({
      message: "Revisión completada",
      ...result,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Error al cancelar reservas caducadas",
    });
  }
};