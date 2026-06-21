import prisma from "../lib/prisma.js";
import {
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

const validateSummerCampForPublicInscription = (summerCamp) => {
  if (!summerCamp) {
    throw new Error("Campamento no encontrado");
  }

  if (!summerCamp.isActive) {
    throw new Error("El campamento está inactivo");
  }

  if (!summerCamp.formEnabled) {
    throw new Error("El formulario de inscripción no está disponible actualmente");
  }

  const now = new Date();

  if (
    summerCamp.inscriptionOpenDate &&
    now < new Date(summerCamp.inscriptionOpenDate)
  ) {
    throw new Error("El periodo de inscripción todavía no está abierto");
  }

  if (
    summerCamp.inscriptionCloseDate &&
    now > new Date(summerCamp.inscriptionCloseDate)
  ) {
    throw new Error("El periodo de inscripción ya está cerrado");
  }
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
    const total = pendingSignedUps.reduce(
      (sum, item) => sum + Number(item.priceApplied || 0),
      0
    );

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
      const [first, second] = splitAmountInTwo(Number(item.priceApplied || 0));
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
    const { summerCampId, number, globalStatus, paymentMode } =
      req.validatedQuery;

    const where = {};

    if (summerCampId !== undefined) {
      where.summerCampId = summerCampId;
    }

    if (globalStatus !== undefined) {
      where.globalStatus = globalStatus;
    }

    if (paymentMode !== undefined) {
      where.paymentMode = paymentMode;
    }

    if (number !== undefined) {
      where.signedUpWeeks = {
        some: {
          week: {
            number,
            ...(summerCampId !== undefined && { summerCampId }),
          },
        },
      };
    }

    const inscriptions = await prisma.inscription.findMany({
      where,
      orderBy: {
        inscriptionDate: "desc",
      },
      include: {
        summerCamp: true,
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
        summerCamp: true,
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
      summerCampId,
      participant,
      guardian,
      address,
      authorizedPeople,
      inscription,
      weeks,
      discounts = [],
    } = req.validatedBody;

    const manualDiscountRequests = discounts;
    const hasDisability = participant.hasDisability === true;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const summerCamp = await tx.summerCamp.findUnique({
        where: {
          id: summerCampId,
        },
      });

      validateSummerCampForPublicInscription(summerCamp);

      const validatedWeeks = [];

      for (const selectedWeek of weeks) {
        if (
          selectedWeek.summerCampId !== undefined &&
          Number(selectedWeek.summerCampId) !== Number(summerCampId)
        ) {
          throw new Error(
            "Todas las semanas deben pertenecer al campamento seleccionado"
          );
        }

        const foundWeek = await tx.week.findUnique({
          where: {
            summerCampId_number: {
              summerCampId,
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
            `La semana ${selectedWeek.number} no existe en el campamento seleccionado`
          );
        }

        if (!foundWeek.active) {
          throw new Error(
            `La semana ${selectedWeek.number} del campamento seleccionado está inactiva`
          );
        }

        if (foundWeek.summerCampId !== summerCampId) {
          throw new Error(
            "Todas las semanas deben pertenecer al campamento seleccionado"
          );
        }

        if (!foundWeek.summerCamp || !foundWeek.summerCamp.isActive) {
          throw new Error("El campamento está inactivo");
        }

        if (!foundWeek.summerCamp.formEnabled) {
          throw new Error(
            "El formulario de inscripción no está disponible actualmente"
          );
        }

        if (
          foundWeek.summerCamp.inscriptionOpenDate &&
          now < new Date(foundWeek.summerCamp.inscriptionOpenDate)
        ) {
          throw new Error("El periodo de inscripción todavía no está abierto");
        }

        if (
          foundWeek.summerCamp.inscriptionCloseDate &&
          now > new Date(foundWeek.summerCamp.inscriptionCloseDate)
        ) {
          throw new Error("El periodo de inscripción ya está cerrado");
        }

        if (foundWeek.prices.length === 0) {
          throw new Error(
            `La semana ${selectedWeek.number} del campamento seleccionado no tiene precio activo`
          );
        }

        validatedWeeks.push({
          selectedWeek,
          week: foundWeek,
          activePrice: foundWeek.prices[0],
        });
      }

      const participantNotes = [
        participant.hasDisability && participant.disabilityInfo
          ? `Información adicional sobre discapacidad: ${participant.disabilityInfo}`
          : null,
        participant.symptomsInfo
          ? `Síntomas habituales: ${participant.symptomsInfo}`
          : null,
      ]
        .filter(Boolean)
        .join("\n\n");

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
          schoolObservations: null,
          hasDisability: participant.hasDisability ?? false,
          notes: participantNotes || null,
        },
      });

      if (participant.allergyDescription) {
        await tx.allergy.create({
          data: {
            description: participant.allergyDescription,
            participantId: createdParticipant.id,
          },
        });
      }

      if (participant.medicationDescription) {
        await tx.medication.create({
          data: {
            description: participant.medicationDescription,
            participantId: createdParticipant.id,
          },
        });
      }

      if (participant.hasDisability === true) {
        const createdExtraForm = await tx.extraForm.create({
          data: {
            participantId: createdParticipant.id,
          },
        });

        await tx.disability.create({
          data: {
            disabilityDegree: participant.disabilityDegree || null,
            dependencyDegree: participant.dependencyDegree || null,
            extraFormId: createdExtraForm.id,
          },
        });
      }

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
          ? Number(activePrice.disabilityPrice || 0)
          : Number(activePrice.basePrice || 0);

        if (selectedWeek.breakfast === true) {
          grossAmount += Number(activePrice.breakfastPrice || 0);
        }

        if (selectedWeek.lunch === true) {
          grossAmount += Number(activePrice.lunchPrice || 0);
        }

        if (selectedWeek.earlyRise === true) {
          grossAmount += Number(activePrice.earlyRisePrice || 0);
        }

        const state = getInitialWeekState({ hasDisability, week });
        weekStates.push(state);

        const discountResult = applyDiscountsToAmount(
          grossAmount,
          applicableDiscounts
        );

        const finalAmount = discountResult.finalAmount;

        if (state === "PENDING") {
          if (hasDisability) {
            await tx.week.update({
              where: { id: week.id },
              data: {
                availableDisabilityPlaces:
                  week.availableDisabilityPlaces - 1,
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
          summerCampId,
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
          summerCamp: true,
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
                },
              },
            },
          },
          signedUpWeeks: {
            include: {
              week: {
                include: {
                  summerCamp: true,
                },
              },
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
      error.message?.includes("no encontrado") ||
      error.message?.includes("no existe") ||
      error.message?.includes("inactiva") ||
      error.message?.includes("inactivo") ||
      error.message?.includes("no está disponible") ||
      error.message?.includes("no está abierto") ||
      error.message?.includes("ya está cerrado") ||
      error.message?.includes("no tiene precio activo") ||
      error.message?.includes("deben pertenecer")
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
          summerCamp: true,
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
export const updateInscriptionDetails = async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const {
      inscription,
      participant,
      guardian,
      address,
      allergies,
      medications,
      authorizedPeople,
      extraForm,
      disability,
      sports,
      fears,
      communication,
      foodSensitivities,
    } = req.validatedBody;

    const result = await prisma.$transaction(async (tx) => {
      const existingInscription = await tx.inscription.findUnique({
        where: { id },
        include: {
          participant: {
            include: {
              guardian: true,
              address: true,
            },
          },
        },
      });

      if (!existingInscription) {
        throw new Error("La inscripción no existe");
      }

      const ensureExtraForm = async () => {
        const existingExtraForm = await tx.extraForm.findUnique({
          where: {
            participantId: existingInscription.participantId,
          },
        });

        if (existingExtraForm) return existingExtraForm;

        return tx.extraForm.create({
          data: {
            participantId: existingInscription.participantId,
          },
        });
      };

      if (inscription) {
        await tx.inscription.update({
          where: { id },
          data: {
            ...(inscription.paymentMode !== undefined && {
              paymentMode: inscription.paymentMode,
            }),
            ...(inscription.invoiceRequested !== undefined && {
              invoiceRequested: inscription.invoiceRequested,
            }),
            ...(inscription.invoiceIssued !== undefined && {
              invoiceIssued: inscription.invoiceIssued,
            }),
            ...(inscription.invoiceName !== undefined && {
              invoiceName: inscription.invoiceName || null,
            }),
            ...(inscription.invoiceDni !== undefined && {
              invoiceDni: inscription.invoiceDni || null,
            }),
            ...(inscription.dataTreatmentAccepted !== undefined && {
              dataTreatmentAccepted: inscription.dataTreatmentAccepted,
            }),
            ...(inscription.outingsAccepted !== undefined && {
              outingsAccepted: inscription.outingsAccepted,
            }),
            ...(inscription.imagesAccepted !== undefined && {
              imagesAccepted: inscription.imagesAccepted,
            }),
            ...(inscription.notes !== undefined && {
              notes: inscription.notes || null,
            }),
          },
        });
      }

      if (participant) {
        await tx.participant.update({
          where: { id: existingInscription.participantId },
          data: {
            ...(participant.name !== undefined && {
              name: participant.name,
            }),
            ...(participant.surname !== undefined && {
              surname: participant.surname,
            }),
            ...(participant.birthdate !== undefined && {
              birthdate: new Date(participant.birthdate),
            }),
            ...(participant.gender !== undefined && {
              gender: participant.gender || null,
            }),
            ...(participant.healthCard !== undefined && {
              healthCard: participant.healthCard || null,
            }),
            ...(participant.repeatedBefore !== undefined && {
              repeatedBefore: participant.repeatedBefore,
            }),
            ...(participant.siblings !== undefined && {
              siblings: participant.siblings,
            }),
            ...(participant.schoolRelated !== undefined && {
              schoolRelated: participant.schoolRelated,
            }),
            ...(participant.schoolObservations !== undefined && {
              schoolObservations: participant.schoolObservations || null,
            }),
            ...(participant.notes !== undefined && {
              notes: participant.notes || null,
            }),
          },
        });
      }

      if (guardian) {
        if (existingInscription.participant.guardian) {
          await tx.guardian.update({
            where: {
              id: existingInscription.participant.guardian.id,
            },
            data: {
              ...(guardian.name !== undefined && {
                name: guardian.name,
              }),
              ...(guardian.surname !== undefined && {
                surname: guardian.surname,
              }),
              ...(guardian.dni !== undefined && {
                dni: guardian.dni || null,
              }),
              ...(guardian.phone !== undefined && {
                phone: guardian.phone,
              }),
              ...(guardian.phone2 !== undefined && {
                phone2: guardian.phone2 || null,
              }),
              ...(guardian.email !== undefined && {
                email: guardian.email,
              }),
              ...(guardian.email2 !== undefined && {
                email2: guardian.email2 || null,
              }),
              ...(guardian.relation !== undefined && {
                relation: guardian.relation || null,
              }),
            },
          });
        } else {
          await tx.guardian.create({
            data: {
              name: guardian.name || "",
              surname: guardian.surname || "",
              dni: guardian.dni || null,
              phone: guardian.phone || "",
              phone2: guardian.phone2 || null,
              email: guardian.email || "",
              email2: guardian.email2 || null,
              relation: guardian.relation || null,
              participantId: existingInscription.participantId,
            },
          });
        }
      }

      if (address) {
        if (existingInscription.participant.address) {
          await tx.address.update({
            where: {
              id: existingInscription.participant.address.id,
            },
            data: {
              ...(address.street !== undefined && {
                street: address.street || null,
              }),
              ...(address.city !== undefined && {
                city: address.city || null,
              }),
              ...(address.province !== undefined && {
                province: address.province || null,
              }),
              ...(address.postalCode !== undefined && {
                postalCode: address.postalCode || null,
              }),
            },
          });
        } else {
          await tx.address.create({
            data: {
              street: address.street || null,
              city: address.city || null,
              province: address.province || null,
              postalCode: address.postalCode || null,
              participantId: existingInscription.participantId,
            },
          });
        }
      }

      if (allergies !== undefined) {
        await tx.allergy.deleteMany({
          where: {
            participantId: existingInscription.participantId,
          },
        });

        const cleanAllergies = allergies
          .map((item) => ({
            description: item.description?.trim(),
            participantId: existingInscription.participantId,
          }))
          .filter((item) => item.description);

        if (cleanAllergies.length > 0) {
          await tx.allergy.createMany({
            data: cleanAllergies,
          });
        }
      }

      if (medications !== undefined) {
        await tx.medication.deleteMany({
          where: {
            participantId: existingInscription.participantId,
          },
        });

        const cleanMedications = medications
          .map((item) => ({
            description: item.description?.trim(),
            participantId: existingInscription.participantId,
          }))
          .filter((item) => item.description);

        if (cleanMedications.length > 0) {
          await tx.medication.createMany({
            data: cleanMedications,
          });
        }
      }

      if (authorizedPeople !== undefined) {
        await tx.authorizedPerson.deleteMany({
          where: {
            participantId: existingInscription.participantId,
          },
        });

        const cleanAuthorizedPeople = authorizedPeople
          .map((item) => ({
            name: item.name?.trim(),
            surname: item.surname?.trim(),
            dni: item.dni?.trim() || null,
            phone: item.phone?.trim() || null,
            relation: item.relation?.trim() || null,
            participantId: existingInscription.participantId,
          }))
          .filter(
            (item) => item.name || item.surname || item.phone || item.relation
          );

        if (cleanAuthorizedPeople.length > 0) {
          await tx.authorizedPerson.createMany({
            data: cleanAuthorizedPeople,
          });
        }
      }

      if (extraForm !== undefined) {
        const currentExtraForm = await ensureExtraForm();

        await tx.extraForm.update({
          where: {
            id: currentExtraForm.id,
          },
          data: {
            calledBefore: extraForm.calledBefore ?? null,
            routines: extraForm.routines || null,
            emotionalRegulation: extraForm.emotionalRegulation || null,
            schoolingType: extraForm.schoolingType || null,
            schoolingTypeOther:
              extraForm.schoolingType === "OTHER"
                ? extraForm.schoolingTypeOther || null
                : null,
            supportType: extraForm.supportType || null,
            hygiene: extraForm.hygiene || null,
            bladderControl: extraForm.bladderControl || null,
            bowelControl: extraForm.bowelControl || null,
            eatingSupport: extraForm.eatingSupport || null,
            feedingAdaptation: extraForm.feedingAdaptation || null,
            chokingEpisodes: extraForm.chokingEpisodes ?? null,
            extraInfo: extraForm.extraInfo || null,
          },
        });
      }

      if (disability !== undefined) {
        const currentExtraForm = await ensureExtraForm();

        await tx.disability.upsert({
          where: {
            extraFormId: currentExtraForm.id,
          },
          update: {
            functionalDiversity: disability.functionalDiversity || null,
            disabilityDegree: disability.disabilityDegree || null,
            dependencyDegree: disability.dependencyDegree || null,
            wheelchair: disability.wheelchair ?? null,
            mobilityAid: disability.mobilityAid || null,
            walking: disability.walking || null,
            running: disability.running || null,
            climbing: disability.climbing || null,
            crawling: disability.crawling || null,
            jumping: disability.jumping || null,
            stairs: disability.stairs || null,
            outdoorMobility: disability.outdoorMobility || null,
          },
          create: {
            extraFormId: currentExtraForm.id,
            functionalDiversity: disability.functionalDiversity || null,
            disabilityDegree: disability.disabilityDegree || null,
            dependencyDegree: disability.dependencyDegree || null,
            wheelchair: disability.wheelchair ?? null,
            mobilityAid: disability.mobilityAid || null,
            walking: disability.walking || null,
            running: disability.running || null,
            climbing: disability.climbing || null,
            crawling: disability.crawling || null,
            jumping: disability.jumping || null,
            stairs: disability.stairs || null,
            outdoorMobility: disability.outdoorMobility || null,
          },
        });
      }

      if (sports !== undefined) {
        const currentExtraForm = await ensureExtraForm();

        await tx.sport.deleteMany({
          where: {
            extraFormId: currentExtraForm.id,
          },
        });

        const cleanSports = sports
          .map((item) => ({
            extraFormId: currentExtraForm.id,
            doesSport: item.doesSport ?? null,
            favoriteSports: item.favoriteSports || null,
            swimmingLevel: item.swimmingLevel || null,
            socialPlay: item.socialPlay || null,
            playFixation: item.playFixation || null,
          }))
          .filter(
            (item) =>
              item.doesSport !== null ||
              item.favoriteSports ||
              item.swimmingLevel ||
              item.socialPlay ||
              item.playFixation
          );

        if (cleanSports.length > 0) {
          await tx.sport.createMany({
            data: cleanSports,
          });
        }
      }

      if (fears !== undefined) {
        const currentExtraForm = await ensureExtraForm();

        await tx.fear.deleteMany({
          where: {
            extraFormId: currentExtraForm.id,
          },
        });

        const cleanFears = fears
          .map((item) => ({
            extraFormId: currentExtraForm.id,
            fears: item.fears || null,
            copingMechanisms: item.copingMechanisms || null,
          }))
          .filter((item) => item.fears || item.copingMechanisms);

        if (cleanFears.length > 0) {
          await tx.fear.createMany({
            data: cleanFears,
          });
        }
      }

      if (communication !== undefined) {
        const currentExtraForm = await ensureExtraForm();

        await tx.communication.deleteMany({
          where: {
            extraFormId: currentExtraForm.id,
          },
        });

        const cleanCommunication = communication
          .map((item) => ({
            extraFormId: currentExtraForm.id,
            oralLanguage: item.oralLanguage || null,
            imitation: item.imitation || null,
            writing: item.writing || null,
            comprehension: item.comprehension || null,
            comprehensionOther:
              item.comprehension === "OTHER"
                ? item.comprehensionOther || null
                : null,
            reading: item.reading || null,
            readingOther:
              item.reading === "OTHER" ? item.readingOther || null : null,
            alternativeCommunication: item.alternativeCommunication || null,
            alternativeCommunicationOther:
              item.alternativeCommunication === "OTHER"
                ? item.alternativeCommunicationOther || null
                : null,
          }))
          .filter(
            (item) =>
              item.oralLanguage ||
              item.imitation ||
              item.writing ||
              item.comprehension ||
              item.comprehensionOther ||
              item.reading ||
              item.readingOther ||
              item.alternativeCommunication ||
              item.alternativeCommunicationOther
          );

        if (cleanCommunication.length > 0) {
          await tx.communication.createMany({
            data: cleanCommunication,
          });
        }
      }

      if (foodSensitivities !== undefined) {
        const currentExtraForm = await ensureExtraForm();

        await tx.foodSensitivity.deleteMany({
          where: {
            extraFormId: currentExtraForm.id,
          },
        });

        const cleanFoodSensitivities = foodSensitivities
          .map((item) => ({
            extraFormId: currentExtraForm.id,
            type: item.type,
            otherText: item.type === "OTHER" ? item.otherText || null : null,
          }))
          .filter((item) => item.type);

        if (cleanFoodSensitivities.length > 0) {
          await tx.foodSensitivity.createMany({
            data: cleanFoodSensitivities,
          });
        }
      }

      return tx.inscription.findUnique({
        where: { id },
        include: {
          summerCamp: true,
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

    return res.json({
      message: "Inscripción actualizada correctamente",
      inscription: result,
    });
  } catch (error) {
    console.error("Error al actualizar inscripción:", error);

    return res.status(500).json({
      error: error.message || "Error al actualizar inscripción",
    });
  }
};