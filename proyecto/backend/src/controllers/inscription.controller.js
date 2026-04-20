import prisma from "../lib/prisma.js";
import {
  extractManualDiscountRequests,
  resolveApplicableDiscountsForCreation,
  createInscriptionDiscountRows,
  applyDiscountsToAmount,
} from "../services/discount.service.js";

const getInitialWeekState = ({ hasDisability, week }) => {
  if (hasDisability) {
    return week.availableDisabilityPlaces > 0 ? "PENDING" : "WAITLIST";
  }

  return week.availablePlaces > 0 ? "PENDING" : "WAITLIST";
};

const getInitialInscriptionStatus = (weekStates) => {
  const allPending = weekStates.every((state) => state === "PENDING");
  const allWaitlist = weekStates.every((state) => state === "WAITLIST");

  if (allPending) return "PENDING";
  if (allWaitlist) return "WAITLIST";

  return "PARTIALLY_ACCEPTED";
};

const splitAmountInTwo = (amount) => {
  const first = Number((amount / 2).toFixed(2));
  const second = Number((amount - first).toFixed(2));
  return [first, second];
};

const createReservationPaymentsForSignedUps = async ({
  tx,
  inscriptionId,
  paymentMode,
  signedUps,
  conceptBase,
}) => {
  const pendingSignedUps = signedUps.filter((item) => item.state === "PENDING");

  if (pendingSignedUps.length === 0) {
    return;
  }

  if (paymentMode === "ONE_PAYMENT") {
    const total = pendingSignedUps.reduce((sum, item) => sum + item.priceApplied, 0);

    const payment = await tx.payment.create({
      data: {
        paymentType: "FULL",
        status: "PENDING",
        amount: total,
        concept: conceptBase,
        isMandatory: true,
        inscriptionId,
      },
    });

    for (const item of pendingSignedUps) {
      await tx.paymentSignedUp.create({
        data: {
          paymentId: payment.id,
          inscriptionId,
          weekId: item.weekId,
          purpose: "RESERVATION",
          amount: item.priceApplied,
        },
      });
    }

    return;
  }

  if (paymentMode === "TWO_PAYMENTS") {
    const firstAmounts = [];
    const secondAmounts = [];

    for (const item of pendingSignedUps) {
      const [first, second] = splitAmountInTwo(item.priceApplied);
      firstAmounts.push({ weekId: item.weekId, amount: first });
      secondAmounts.push({ weekId: item.weekId, amount: second });
    }

    const firstTotal = firstAmounts.reduce((sum, item) => sum + item.amount, 0);
    const secondTotal = secondAmounts.reduce((sum, item) => sum + item.amount, 0);

    const firstPayment = await tx.payment.create({
      data: {
        paymentType: "FIRST_INSTALLMENT",
        status: "PENDING",
        amount: firstTotal,
        concept: `${conceptBase} - primer pago`,
        isMandatory: true,
        inscriptionId,
      },
    });

    const secondPayment = await tx.payment.create({
      data: {
        paymentType: "SECOND_INSTALLMENT",
        status: "PENDING",
        amount: secondTotal,
        concept: `${conceptBase} - segundo pago`,
        isMandatory: true,
        inscriptionId,
      },
    });

    for (const item of firstAmounts) {
      await tx.paymentSignedUp.create({
        data: {
          paymentId: firstPayment.id,
          inscriptionId,
          weekId: item.weekId,
          purpose: "RESERVATION",
          amount: item.amount,
        },
      });
    }

    for (const item of secondAmounts) {
      await tx.paymentSignedUp.create({
        data: {
          paymentId: secondPayment.id,
          inscriptionId,
          weekId: item.weekId,
          purpose: "RESERVATION",
          amount: item.amount,
        },
      });
    }
  }
};

export const getInscriptions = async (req, res) => {
  try {
    const { summerCampId, number, globalStatus, paymentMode } = req.validatedQuery;

    const where = {};

    if (globalStatus !== undefined) {
      where.globalStatus = globalStatus;
    }

    if (paymentMode !== undefined) {
      where.paymentMode = paymentMode;
    }

    if (summerCampId !== undefined || number !== undefined) {
      where.signedUpWeeks = {
        some: {},
      };

      if (summerCampId !== undefined) {
        where.signedUpWeeks.some.week = {
          summerCampId,
        };
      }

      if (number !== undefined) {
        if (!where.signedUpWeeks.some.week) {
          where.signedUpWeeks.some.week = {};
        }

        where.signedUpWeeks.some.week.number = number;
      }
    }

    const inscriptions = await prisma.inscription.findMany({
      where,
      orderBy: {
        inscriptionDate: "desc",
      },
      include: {
        participant: {
          include: {
            guardian: true,
            address: true,
            authorizedPeople: true,
          },
        },
        signedUpWeeks: {
          include: {
            week: {
              include: {
                summerCamp: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        payments: {
          orderBy: {
            createdAt: "asc",
          },
        },
        appliedDiscounts: {
          include: {
            discount: true,
          },
        },
      },
    });

    res.json(inscriptions);
  } catch (error) {
    console.error("Error al obtener inscripciones:", error);
    res.status(500).json({ error: "Error al obtener inscripciones" });
  }
};

export const getInscriptionById = async (req, res) => {
  try {
    const { id } = req.validatedParams;

    const inscription = await prisma.inscription.findUnique({
      where: { id },
      include: {
        participant: {
          include: {
            guardian: true,
            address: true,
            authorizedPeople: true,
            allergies: true,
            medications: true,
            extraForm: {
              include: {
                disability: true,
                sports: true,
                fears: true,
                communication: true,
                foodSensitivities: true,
              },
            },
          },
        },
        signedUpWeeks: {
          include: {
            week: {
              include: {
                summerCamp: true,
                prices: true,
              },
            },
          },
          orderBy: {
            createdAt: "asc",
          },
        },
        payments: {
          orderBy: {
            createdAt: "asc",
          },
        },
        appliedDiscounts: {
          include: {
            discount: true,
          },
        },
      },
    });

    if (!inscription) {
      return res.status(404).json({
        error: "La inscripción no existe",
      });
    }

    res.json(inscription);
  } catch (error) {
    console.error("Error al obtener la inscripción:", error);
    res.status(500).json({ error: "Error al obtener la inscripción" });
  }
};

export const createInscription = async (req, res) => {
  try {
    const {
      participant,
      guardian,
      address,
      authorizedPeople,
      inscription,
      weeks,
      discounts = [],
    } = req.validatedBody;

    const manualDiscountRequests = extractManualDiscountRequests({ discounts });
    const hasDisability = participant.hasDisability === true;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const validatedWeeks = [];

      for (const selectedWeek of weeks) {
        const foundWeek = await tx.week.findUnique({
          where: {
            summerCampId_number: {
              summerCampId: selectedWeek.summerCampId,
              number: selectedWeek.number,
            },
          },
          include: {
            summerCamp: true,
            prices: {
              where: { isActive: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        });

        if (!foundWeek) {
          throw new Error(
            `La semana ${selectedWeek.number} del campamento ${selectedWeek.summerCampId} no existe`
          );
        }

        if (!foundWeek.active) {
          throw new Error(
            `La semana ${selectedWeek.number} del campamento ${selectedWeek.summerCampId} está inactiva`
          );
        }

        if (!foundWeek.summerCamp || !foundWeek.summerCamp.isActive) {
          throw new Error(`El campamento ${selectedWeek.summerCampId} está inactivo`);
        }

        if (
          foundWeek.summerCamp.inscriptionOpenDate &&
          now < new Date(foundWeek.summerCamp.inscriptionOpenDate)
        ) {
          throw new Error(
            `El periodo de inscripción del campamento ${selectedWeek.summerCampId} aún no está abierto`
          );
        }

        if (
          foundWeek.summerCamp.inscriptionCloseDate &&
          now > new Date(foundWeek.summerCamp.inscriptionCloseDate)
        ) {
          throw new Error(
            `El periodo de inscripción del campamento ${selectedWeek.summerCampId} ya está cerrado`
          );
        }

        if (foundWeek.prices.length === 0) {
          throw new Error(
            `La semana ${selectedWeek.number} del campamento ${selectedWeek.summerCampId} no tiene precio activo`
          );
        }

        validatedWeeks.push({
          selectedWeek,
          week: foundWeek,
          activePrice: foundWeek.prices[0],
        });
      }

      const createdParticipant = await tx.participant.create({
        data: {
          name: participant.name,
          surname: participant.surname,
          birthdate: new Date(participant.birthdate),
          gender: participant.gender || null,
          healthCard: participant.healthCard || null,
          repeatedBefore: participant.repeatedBefore ?? false,
          siblings: participant.siblings ?? false,
          schoolRelated: participant.schoolRelated ?? false,
          schoolObservations: participant.schoolObservations || null,
          hasDisability: participant.hasDisability ?? false,
          notes: participant.notes || null,
        },
      });

      await tx.guardian.create({
        data: {
          name: guardian.name,
          surname: guardian.surname,
          dni: guardian.dni || null,
          phone: guardian.phone,
          phone2: guardian.phone2 || null,
          email: guardian.email,
          email2: guardian.email2 || null,
          relation: guardian.relation || null,
          participantId: createdParticipant.id,
        },
      });

      await tx.address.create({
        data: {
          street: address.street || null,
          city: address.city || null,
          province: address.province || null,
          postalCode: address.postalCode || null,
          participantId: createdParticipant.id,
        },
      });

      for (const person of authorizedPeople) {
        await tx.authorizedPerson.create({
          data: {
            name: person.name,
            surname: person.surname,
            dni: person.dni || null,
            phone: person.phone || null,
            relation: person.relation || null,
            participantId: createdParticipant.id,
          },
        });
      }

      const applicableDiscounts = await resolveApplicableDiscountsForCreation(
        tx,
        participant,
        manualDiscountRequests
      );

      const weekStates = [];
      const signedUpRows = [];
      let totalAmountExpected = 0;

      for (const item of validatedWeeks) {
        const { selectedWeek, week, activePrice } = item;

        let grossAmount = hasDisability
          ? activePrice.disabilityPrice
          : activePrice.basePrice;

        if (selectedWeek.breakfast === true) {
          grossAmount += activePrice.breakfastPrice;
        }

        if (selectedWeek.lunch === true) {
          grossAmount += activePrice.lunchPrice;
        }

        if (selectedWeek.earlyRise === true) {
          grossAmount += activePrice.earlyRisePrice;
        }

        const state = getInitialWeekState({ hasDisability, week });
        weekStates.push(state);

        let finalAmount = grossAmount;

        if (state === "PENDING") {
          const discountResult = applyDiscountsToAmount(
            grossAmount,
            applicableDiscounts
          );

          finalAmount = discountResult.finalAmount;

          if (hasDisability) {
            await tx.week.update({
              where: { id: week.id },
              data: {
                availableDisabilityPlaces: week.availableDisabilityPlaces - 1,
              },
            });
          } else {
            await tx.week.update({
              where: { id: week.id },
              data: {
                availablePlaces: week.availablePlaces - 1,
              },
            });
          }

          totalAmountExpected += finalAmount;
        }

        signedUpRows.push({
          weekId: week.id,
          state,
          priceApplied: finalAmount,
          breakfast: selectedWeek.breakfast ?? false,
          lunch: selectedWeek.lunch ?? false,
          earlyRise: selectedWeek.earlyRise ?? false,
        });
      }

      const createdInscription = await tx.inscription.create({
        data: {
          inscriptionDate: now,
          paymentMode: inscription.paymentMode,
          globalStatus: getInitialInscriptionStatus(weekStates),
          totalAmountExpected,
          totalAmountPaid: 0,
          totalAmountPending: totalAmountExpected,
          invoiceRequested: inscription.invoiceRequested ?? false,
          invoiceIssued: false,
          invoiceName: inscription.invoiceName || null,
          invoiceDni: inscription.invoiceDni || null,
          dataTreatmentAccepted: inscription.dataTreatmentAccepted,
          outingsAccepted: inscription.outingsAccepted,
          imagesAccepted: inscription.imagesAccepted,
          notes: inscription.notes || null,
          participantId: createdParticipant.id,
        },
      });

      await createInscriptionDiscountRows(
        tx,
        createdInscription.id,
        applicableDiscounts
      );

      const createdSignedUps = [];

      for (const row of signedUpRows) {
        const createdSignedUp = await tx.signedUp.create({
          data: {
            inscriptionId: createdInscription.id,
            weekId: row.weekId,
            state: row.state,
            priceApplied: row.priceApplied,
            breakfast: row.breakfast,
            lunch: row.lunch,
            earlyRise: row.earlyRise,
          },
        });

        createdSignedUps.push(createdSignedUp);
      }

      await createReservationPaymentsForSignedUps({
        tx,
        inscriptionId: createdInscription.id,
        paymentMode: inscription.paymentMode,
        signedUps: createdSignedUps,
        conceptBase: "Pago inicial de reservas",
      });

      return tx.inscription.findUnique({
        where: { id: createdInscription.id },
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
          appliedDiscounts: {
            include: {
              discount: true,
            },
          },
        },
      });
    });

    return res.status(201).json(result);
  } catch (error) {
    console.error("Error al crear inscripción:", error);

    if (
      error.message?.includes("no existe") ||
      error.message?.includes("está inactiva") ||
      error.message?.includes("está inactivo") ||
      error.message?.includes("aún no está abierto") ||
      error.message?.includes("ya está cerrado") ||
      error.message?.includes("no tiene precio activo")
    ) {
      return res.status(400).json({
        error: error.message,
      });
    }

    return res.status(500).json({
      error: error.message || "Error al crear inscripción",
    });
  }
};

export const cancelInscription = async (req, res) => {
  try {
    const { id } = req.validatedParams;

    const result = await prisma.$transaction(async (tx) => {
      const inscription = await tx.inscription.findUnique({
        where: { id },
        include: {
          participant: true,
          signedUpWeeks: {
            include: {
              week: true,
            },
            orderBy: {
              createdAt: "asc",
            },
          },
          payments: true,
        },
      });

      if (!inscription) {
        throw new Error("La inscripción no existe");
      }

      if (inscription.globalStatus === "CANCELLED") {
        throw new Error("La inscripción ya está cancelada");
      }

      const hasDisability = inscription.participant.hasDisability === true;

      for (const signedUp of inscription.signedUpWeeks) {
        if (signedUp.state === "CANCELLED") {
          continue;
        }

        if (signedUp.state === "WAITLIST") {
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

          continue;
        }

        if (signedUp.state === "PENDING" || signedUp.state === "ACCEPTED") {
          const waitlistCount = await tx.signedUp.count({
            where: {
              weekId: signedUp.weekId,
              state: "WAITLIST",
              inscriptionId: {
                not: id,
              },
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
        }
      }

      await tx.inscription.update({
        where: { id },
        data: {
          globalStatus: "CANCELLED",
        },
      });

      return tx.inscription.findUnique({
        where: { id },
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
      message: "Inscripción cancelada correctamente",
      inscription: result,
    });
  } catch (error) {
    console.error("Error al cancelar la inscripción:", error);
    res.status(500).json({
      error: error.message || "Error al cancelar la inscripción",
    });
  }
};