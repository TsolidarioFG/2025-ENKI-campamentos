import prisma from "../lib/prisma.js";

const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim() !== "";
};

const isBoolean = (value) => {
  return typeof value === "boolean";
};

const isValidDate = (value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const isPositiveInteger = (value) => {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0;
};

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
    const { summerCampId, number, globalStatus, paymentMode } = req.query;

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
        const parsedSummerCampId = Number(summerCampId);

        if (!Number.isInteger(parsedSummerCampId) || parsedSummerCampId <= 0) {
          return res.status(400).json({
            error: "summerCampId debe ser un número entero mayor que 0",
          });
        }

        where.signedUpWeeks.some.week = {
          summerCampId: parsedSummerCampId,
        };
      }

      if (number !== undefined) {
        const parsedNumber = Number(number);

        if (!Number.isInteger(parsedNumber) || parsedNumber <= 0) {
          return res.status(400).json({
            error: "number debe ser un número entero mayor que 0",
          });
        }

        if (!where.signedUpWeeks.some.week) {
          where.signedUpWeeks.some.week = {};
        }

        where.signedUpWeeks.some.week.number = parsedNumber;
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
    const { id } = req.params;

    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        error: "id debe ser un número entero mayor que 0",
      });
    }

    const inscription = await prisma.inscription.findUnique({
      where: { id: parsedId },
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
    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    const {
      participant,
      guardian,
      address,
      authorizedPeople,
      inscription,
      weeks,
    } = req.body;

    if (!participant || typeof participant !== "object") {
      return res.status(400).json({
        error: "participant es obligatorio y debe ser un objeto",
      });
    }

    if (!guardian || typeof guardian !== "object") {
      return res.status(400).json({
        error: "guardian es obligatorio y debe ser un objeto",
      });
    }

    if (!address || typeof address !== "object") {
      return res.status(400).json({
        error: "address es obligatorio y debe ser un objeto",
      });
    }

    if (!inscription || typeof inscription !== "object") {
      return res.status(400).json({
        error: "inscription es obligatorio y debe ser un objeto",
      });
    }

    if (!Array.isArray(authorizedPeople)) {
      return res.status(400).json({
        error: "authorizedPeople debe ser un array",
      });
    }

    if (!Array.isArray(weeks) || weeks.length === 0) {
      return res.status(400).json({
        error: "weeks debe ser un array con al menos una semana",
      });
    }

    if (!isNonEmptyString(participant.name)) {
      return res.status(400).json({
        error: "participant.name es obligatorio",
      });
    }

    if (!isNonEmptyString(participant.surname)) {
      return res.status(400).json({
        error: "participant.surname es obligatorio",
      });
    }

    if (!participant.birthdate || !isValidDate(participant.birthdate)) {
      return res.status(400).json({
        error: "participant.birthdate es obligatorio y debe ser una fecha válida",
      });
    }

    if (
      participant.hasDisability !== undefined &&
      !isBoolean(participant.hasDisability)
    ) {
      return res.status(400).json({
        error: "participant.hasDisability debe ser booleano",
      });
    }

    if (
      participant.repeatedBefore !== undefined &&
      !isBoolean(participant.repeatedBefore)
    ) {
      return res.status(400).json({
        error: "participant.repeatedBefore debe ser booleano",
      });
    }

    if (
      participant.siblings !== undefined &&
      !isBoolean(participant.siblings)
    ) {
      return res.status(400).json({
        error: "participant.siblings debe ser booleano",
      });
    }

    if (
      participant.schoolRelated !== undefined &&
      !isBoolean(participant.schoolRelated)
    ) {
      return res.status(400).json({
        error: "participant.schoolRelated debe ser booleano",
      });
    }

    if (!isNonEmptyString(guardian.name)) {
      return res.status(400).json({
        error: "guardian.name es obligatorio",
      });
    }

    if (!isNonEmptyString(guardian.surname)) {
      return res.status(400).json({
        error: "guardian.surname es obligatorio",
      });
    }

    if (!isNonEmptyString(guardian.phone)) {
      return res.status(400).json({
        error: "guardian.phone es obligatorio",
      });
    }

    if (!isNonEmptyString(guardian.email)) {
      return res.status(400).json({
        error: "guardian.email es obligatorio",
      });
    }

    if (!isNonEmptyString(address.city)) {
      return res.status(400).json({
        error: "address.city es obligatorio",
      });
    }

    if (!isNonEmptyString(address.province)) {
      return res.status(400).json({
        error: "address.province es obligatorio",
      });
    }

    for (const person of authorizedPeople) {
      if (!person || typeof person !== "object") {
        return res.status(400).json({
          error: "Cada persona autorizada debe ser un objeto válido",
        });
      }

      if (!isNonEmptyString(person.name)) {
        return res.status(400).json({
          error: "authorizedPerson.name es obligatorio",
        });
      }

      if (!isNonEmptyString(person.surname)) {
        return res.status(400).json({
          error: "authorizedPerson.surname es obligatorio",
        });
      }
    }

    if (!isNonEmptyString(inscription.paymentMode)) {
      return res.status(400).json({
        error: "inscription.paymentMode es obligatorio",
      });
    }

    const validPaymentModes = ["ONE_PAYMENT", "TWO_PAYMENTS"];
    if (!validPaymentModes.includes(inscription.paymentMode)) {
      return res.status(400).json({
        error: "inscription.paymentMode debe ser ONE_PAYMENT o TWO_PAYMENTS",
      });
    }

    if (
      inscription.invoiceRequested !== undefined &&
      !isBoolean(inscription.invoiceRequested)
    ) {
      return res.status(400).json({
        error: "inscription.invoiceRequested debe ser booleano",
      });
    }

    if (
      !isBoolean(inscription.dataTreatmentAccepted) ||
      !inscription.dataTreatmentAccepted
    ) {
      return res.status(400).json({
        error: "Debe aceptarse el tratamiento de datos",
      });
    }

    if (!isBoolean(inscription.outingsAccepted)) {
      return res.status(400).json({
        error: "inscription.outingsAccepted debe ser booleano",
      });
    }

    if (!isBoolean(inscription.imagesAccepted)) {
      return res.status(400).json({
        error: "inscription.imagesAccepted debe ser booleano",
      });
    }

    const seenWeeks = new Set();

    for (const week of weeks) {
      if (!week || typeof week !== "object") {
        return res.status(400).json({
          error: "Cada elemento de weeks debe ser un objeto válido",
        });
      }

      if (!isPositiveInteger(week.summerCampId)) {
        return res.status(400).json({
          error: "Cada semana debe incluir un summerCampId válido",
        });
      }

      if (!isPositiveInteger(week.number)) {
        return res.status(400).json({
          error: "Cada semana debe incluir un number válido",
        });
      }

      const key = `${week.summerCampId}-${week.number}`;
      if (seenWeeks.has(key)) {
        return res.status(400).json({
          error: "No se puede repetir la misma semana en una inscripción",
        });
      }
      seenWeeks.add(key);

      if (week.breakfast !== undefined && !isBoolean(week.breakfast)) {
        return res.status(400).json({
          error: "week.breakfast debe ser booleano",
        });
      }

      if (week.lunch !== undefined && !isBoolean(week.lunch)) {
        return res.status(400).json({
          error: "week.lunch debe ser booleano",
        });
      }

      if (week.earlyRise !== undefined && !isBoolean(week.earlyRise)) {
        return res.status(400).json({
          error: "week.earlyRise debe ser booleano",
        });
      }
    }

    const hasDisability = participant.hasDisability === true;
    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const validatedWeeks = [];

      for (const selectedWeek of weeks) {
        const foundWeek = await tx.week.findUnique({
          where: {
            summerCampId_number: {
              summerCampId: Number(selectedWeek.summerCampId),
              number: Number(selectedWeek.number),
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
          name: participant.name.trim(),
          surname: participant.surname.trim(),
          birthdate: new Date(participant.birthdate),
          gender: participant.gender || null,
          healthCard: participant.healthCard || null,
          repeatedBefore: participant.repeatedBefore ?? false,
          siblings: participant.siblings ?? false,
          schoolRelated: participant.schoolRelated ?? null,
          schoolObservations: participant.schoolObservations || null,
          hasDisability: participant.hasDisability ?? false,
          notes: participant.notes || null,
        },
      });

      await tx.guardian.create({
        data: {
          name: guardian.name.trim(),
          surname: guardian.surname.trim(),
          dni: guardian.dni || null,
          phone: guardian.phone.trim(),
          phone2: guardian.phone2 || null,
          email: guardian.email.trim(),
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
            name: person.name.trim(),
            surname: person.surname.trim(),
            dni: person.dni || null,
            phone: person.phone || null,
            relation: person.relation || null,
            participantId: createdParticipant.id,
          },
        });
      }

      const weekStates = [];
      const signedUpRows = [];
      let totalAmountExpected = 0;

      for (const item of validatedWeeks) {
        const { selectedWeek, week, activePrice } = item;

        let priceApplied = hasDisability
          ? activePrice.disabilityPrice
          : activePrice.basePrice;

        if (selectedWeek.breakfast === true) {
          priceApplied += activePrice.breakfastPrice;
        }

        if (selectedWeek.lunch === true) {
          priceApplied += activePrice.lunchPrice;
        }

        if (selectedWeek.earlyRise === true) {
          priceApplied += activePrice.earlyRisePrice;
        }

        const state = getInitialWeekState({ hasDisability, week });
        weekStates.push(state);

        if (state === "PENDING") {
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

          totalAmountExpected += priceApplied;
        }

        signedUpRows.push({
          weekId: week.id,
          state,
          priceApplied,
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
          appliedDiscounts: true,
        },
      });
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error al crear inscripción:", error);
    res.status(500).json({
      error: error.message || "Error al crear inscripción",
    });
  }
};