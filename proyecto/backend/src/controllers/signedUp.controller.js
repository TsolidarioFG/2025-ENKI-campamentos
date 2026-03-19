import prisma from "../lib/prisma.js";

const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim() !== "";
};

const splitAmountInTwo = (amount) => {
  const first = Number((amount / 2).toFixed(2));
  const second = Number((amount - first).toFixed(2));
  return [first, second];
};

const getGlobalInscriptionStatus = (states) => {
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
    const { inscriptionId, weekId } = req.params;
    const { newState, paymentModeForNewReservation } = req.body;

    const parsedInscriptionId = Number(inscriptionId);
    const parsedWeekId = Number(weekId);

    if (!Number.isInteger(parsedInscriptionId) || parsedInscriptionId <= 0) {
      return res.status(400).json({
        error: "inscriptionId debe ser un número entero mayor que 0",
      });
    }

    if (!Number.isInteger(parsedWeekId) || parsedWeekId <= 0) {
      return res.status(400).json({
        error: "weekId debe ser un número entero mayor que 0",
      });
    }

    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    if (!isNonEmptyString(newState)) {
      return res.status(400).json({
        error: "newState es obligatorio",
      });
    }

    const validStates = ["PENDING", "WAITLIST", "ACCEPTED", "CANCELLED"];

    if (!validStates.includes(newState)) {
      return res.status(400).json({
        error: "newState debe ser PENDING, WAITLIST, ACCEPTED o CANCELLED",
      });
    }

    if (
      paymentModeForNewReservation !== undefined &&
      !["ONE_PAYMENT", "TWO_PAYMENTS"].includes(paymentModeForNewReservation)
    ) {
      return res.status(400).json({
        error: "paymentModeForNewReservation debe ser ONE_PAYMENT o TWO_PAYMENTS",
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const currentSignedUp = await tx.signedUp.findUnique({
        where: {
          inscriptionId_weekId: {
            inscriptionId: parsedInscriptionId,
            weekId: parsedWeekId,
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

      // WAITLIST -> PENDING
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

      // PENDING -> CANCELLED
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

      // WAITLIST -> CANCELLED
      // no cambia plazas

      // PENDING -> ACCEPTED
      // no cambia plazas ni pagos, solo el estado

      await tx.signedUp.update({
        where: {
          inscriptionId_weekId: {
            inscriptionId: parsedInscriptionId,
            weekId: parsedWeekId,
          },
        },
        data: {
          state: newState,
        },
      });

      const updatedSignedUps = await tx.signedUp.findMany({
        where: {
          inscriptionId: parsedInscriptionId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const newGlobalStatus = getGlobalInscriptionStatus(
        updatedSignedUps.map((item) =>
          item.inscriptionId === parsedInscriptionId &&
          item.weekId === parsedWeekId
            ? newState
            : item.state
        )
      );

      await tx.inscription.update({
        where: { id: parsedInscriptionId },
        data: {
          globalStatus: newGlobalStatus,
        },
      });

      return tx.inscription.findUnique({
        where: { id: parsedInscriptionId },
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