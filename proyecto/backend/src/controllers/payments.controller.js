import prisma from "../lib/prisma.js";

const isNonEmptyString = (value) => {
  return typeof value === "string" && value.trim() !== "";
};

const isValidDate = (value) => {
  const parsed = new Date(value);
  return !Number.isNaN(parsed.getTime());
};

const validPaymentMethods = [
  "BANK_TRANSFER",
  "CASH",
  "CARD",
  "BIZUM",
  "OTHER",
];

const validExtraPurposes = [
  "BREAKFAST",
  "LUNCH",
  "EARLY_RISE",
  "OTHER",
];

const validPaymentModes = [
  "ONE_PAYMENT",
  "TWO_PAYMENTS",
];

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

const splitAmountInTwo = (amount) => {
  const first = Number((amount / 2).toFixed(2));
  const second = Number((amount - first).toFixed(2));
  return [first, second];
};

export const getPayments = async (req, res) => {
  try {
    const { inscriptionId, status, paymentType } = req.query;

    const where = {};

    if (inscriptionId !== undefined) {
      const parsedInscriptionId = Number(inscriptionId);

      if (!Number.isInteger(parsedInscriptionId) || parsedInscriptionId <= 0) {
        return res.status(400).json({
          error: "inscriptionId debe ser un número entero mayor que 0",
        });
      }

      where.inscriptionId = parsedInscriptionId;
    }

    if (status !== undefined) {
      where.status = status;
    }

    if (paymentType !== undefined) {
      where.paymentType = paymentType;
    }

    const payments = await prisma.payment.findMany({
      where,
      orderBy: {
        createdAt: "desc",
      },
      include: {
        inscription: {
          include: {
            participant: true,
          },
        },
        paymentAllocations: {
          include: {
            signedUp: {
              include: {
                week: true,
              },
            },
          },
        },
      },
    });

    res.json(payments);
  } catch (error) {
    console.error("Error al obtener pagos:", error);
    res.status(500).json({ error: "Error al obtener pagos" });
  }
};

export const getPaymentById = async (req, res) => {
  try {
    const { id } = req.params;

    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        error: "id debe ser un número entero mayor que 0",
      });
    }

    const payment = await prisma.payment.findUnique({
      where: { id: parsedId },
      include: {
        inscription: {
          include: {
            participant: true,
            payments: true,
            signedUpWeeks: {
              include: {
                week: true,
                paymentAllocations: true,
              },
            },
          },
        },
        paymentAllocations: {
          include: {
            signedUp: {
              include: {
                week: true,
              },
            },
          },
        },
      },
    });

    if (!payment) {
      return res.status(404).json({
        error: "El pago no existe",
      });
    }

    res.json(payment);
  } catch (error) {
    console.error("Error al obtener el pago:", error);
    res.status(500).json({ error: "Error al obtener el pago" });
  }
};

export const createExtraPayment = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    const {
      inscriptionId,
      weekId,
      purpose,
      amount,
      paymentMode,
      concept,
      dueDate,
      notes,
      receiptRequested,
      isMandatory,
    } = req.body;

    const parsedInscriptionId = Number(inscriptionId);
    const parsedWeekId = Number(weekId);
    const parsedAmount = Number(amount);

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

    if (!validExtraPurposes.includes(purpose)) {
      return res.status(400).json({
        error: "purpose debe ser BREAKFAST, LUNCH, EARLY_RISE o OTHER",
      });
    }

    if (Number.isNaN(parsedAmount) || parsedAmount <= 0) {
      return res.status(400).json({
        error: "amount debe ser un número mayor que 0",
      });
    }

    if (!validPaymentModes.includes(paymentMode)) {
      return res.status(400).json({
        error: "paymentMode debe ser ONE_PAYMENT o TWO_PAYMENTS",
      });
    }

    if (dueDate !== undefined && !isValidDate(dueDate)) {
      return res.status(400).json({
        error: "dueDate debe ser una fecha válida",
      });
    }

    const finalDueDate = dueDate ? new Date(dueDate) : null;

    const result = await prisma.$transaction(async (tx) => {
      const signedUp = await tx.signedUp.findUnique({
        where: {
          inscriptionId_weekId: {
            inscriptionId: parsedInscriptionId,
            weekId: parsedWeekId,
          },
        },
        include: {
          inscription: true,
          week: true,
        },
      });

      if (!signedUp) {
        throw new Error("La reserva semanal indicada no existe para esa inscripción");
      }

      if (signedUp.state === "WAITLIST" || signedUp.state === "CANCELLED") {
        throw new Error(
          "No se puede crear un pago extra para una semana que no esté reservada"
        );
      }

      if (paymentMode === "ONE_PAYMENT") {
        const payment = await tx.payment.create({
          data: {
            paymentType: "EXTRA",
            status: "PENDING",
            amount: parsedAmount,
            concept:
              concept ||
              `Pago extra ${purpose} para semana ${signedUp.week.number}`,
            dueDate: finalDueDate,
            receiptRequested: receiptRequested ?? false,
            isMandatory: isMandatory ?? true,
            notes: notes || null,
            inscriptionId: parsedInscriptionId,
          },
        });

        await tx.paymentSignedUp.create({
          data: {
            paymentId: payment.id,
            inscriptionId: parsedInscriptionId,
            weekId: parsedWeekId,
            purpose,
            amount: parsedAmount,
            notes: notes || null,
          },
        });
      }

      if (paymentMode === "TWO_PAYMENTS") {
        const [firstAmount, secondAmount] = splitAmountInTwo(parsedAmount);

        const firstPayment = await tx.payment.create({
          data: {
            paymentType: "EXTRA",
            status: "PENDING",
            amount: firstAmount,
            concept:
              concept ||
              `Primer pago extra ${purpose} para semana ${signedUp.week.number}`,
            dueDate: finalDueDate,
            receiptRequested: receiptRequested ?? false,
            isMandatory: isMandatory ?? true,
            notes: notes || null,
            inscriptionId: parsedInscriptionId,
          },
        });

        const secondPayment = await tx.payment.create({
          data: {
            paymentType: "EXTRA",
            status: "PENDING",
            amount: secondAmount,
            concept:
              concept ||
              `Segundo pago extra ${purpose} para semana ${signedUp.week.number}`,
            dueDate: finalDueDate,
            receiptRequested: receiptRequested ?? false,
            isMandatory: isMandatory ?? true,
            notes: notes || null,
            inscriptionId: parsedInscriptionId,
          },
        });

        await tx.paymentSignedUp.create({
          data: {
            paymentId: firstPayment.id,
            inscriptionId: parsedInscriptionId,
            weekId: parsedWeekId,
            purpose,
            amount: firstAmount,
            notes: notes || null,
          },
        });

        await tx.paymentSignedUp.create({
          data: {
            paymentId: secondPayment.id,
            inscriptionId: parsedInscriptionId,
            weekId: parsedWeekId,
            purpose,
            amount: secondAmount,
            notes: notes || null,
          },
        });
      }

      const updatedInscription = await tx.inscription.update({
        where: { id: parsedInscriptionId },
        data: {
          totalAmountExpected: signedUp.inscription.totalAmountExpected + parsedAmount,
          totalAmountPending: signedUp.inscription.totalAmountPending + parsedAmount,
        },
      });

      return tx.inscription.findUnique({
        where: { id: updatedInscription.id },
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

    res.status(201).json({
      message: "Pago extra creado correctamente",
      inscription: result,
    });
  } catch (error) {
    console.error("Error al crear el pago extra:", error);
    res.status(500).json({
      error: error.message || "Error al crear el pago extra",
    });
  }
};

export const registerPayment = async (req, res) => {
  try {
    const { id } = req.params;
    const { method, paidAt, notes } = req.body;

    const parsedId = Number(id);

    if (!Number.isInteger(parsedId) || parsedId <= 0) {
      return res.status(400).json({
        error: "id debe ser un número entero mayor que 0",
      });
    }

    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    if (!isNonEmptyString(method)) {
      return res.status(400).json({
        error: "method es obligatorio",
      });
    }

    if (!validPaymentMethods.includes(method)) {
      return res.status(400).json({
        error: "method debe ser BANK_TRANSFER, CASH, CARD, BIZUM o OTHER",
      });
    }

    if (paidAt !== undefined && !isValidDate(paidAt)) {
      return res.status(400).json({
        error: "paidAt debe ser una fecha válida",
      });
    }

    const finalPaidAt = paidAt ? new Date(paidAt) : new Date();

    const result = await prisma.$transaction(async (tx) => {
      const existingPayment = await tx.payment.findUnique({
        where: { id: parsedId },
        include: {
          inscription: {
            include: {
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
            },
          },
          paymentAllocations: {
            include: {
              signedUp: true,
            },
          },
        },
      });

      if (!existingPayment) {
        throw new Error("El pago no existe");
      }

      if (existingPayment.status === "PAID") {
        throw new Error("El pago ya estaba registrado como pagado");
      }

      if (existingPayment.status === "CANCELLED") {
        throw new Error("No se puede registrar un pago cancelado");
      }

      await tx.payment.update({
        where: { id: parsedId },
        data: {
          status: "PAID",
          method,
          paidAt: finalPaidAt,
          notes: notes !== undefined ? notes : existingPayment.notes,
        },
      });

      const inscriptionPayments = await tx.payment.findMany({
        where: {
          inscriptionId: existingPayment.inscriptionId,
        },
      });

      const totalAmountPaid = inscriptionPayments.reduce((sum, payment) => {
        if (payment.id === parsedId) {
          return sum + payment.amount;
        }

        if (payment.status === "PAID") {
          return sum + payment.amount;
        }

        return sum;
      }, 0);

      const totalAmountPending = Number(
        (
          existingPayment.inscription.totalAmountExpected - totalAmountPaid
        ).toFixed(2)
      );

      await tx.inscription.update({
        where: { id: existingPayment.inscriptionId },
        data: {
          totalAmountPaid,
          totalAmountPending,
        },
      });

      const reservationAllocations = existingPayment.paymentAllocations.filter(
        (allocation) => allocation.purpose === "RESERVATION"
      );

      for (const allocation of reservationAllocations) {
        const allReservationAllocationsForSignedUp = await tx.paymentSignedUp.findMany({
          where: {
            inscriptionId: allocation.inscriptionId,
            weekId: allocation.weekId,
            purpose: "RESERVATION",
          },
          include: {
            payment: true,
          },
        });

        const fullyPaid = allReservationAllocationsForSignedUp.every(
          (item) =>
            item.payment.id === parsedId
              ? true
              : item.payment.status === "PAID"
        );

        if (fullyPaid) {
          const targetSignedUp = await tx.signedUp.findUnique({
            where: {
              inscriptionId_weekId: {
                inscriptionId: allocation.inscriptionId,
                weekId: allocation.weekId,
              },
            },
          });

          if (targetSignedUp && targetSignedUp.state === "PENDING") {
            await tx.signedUp.update({
              where: {
                inscriptionId_weekId: {
                  inscriptionId: allocation.inscriptionId,
                  weekId: allocation.weekId,
                },
              },
              data: {
                state: "ACCEPTED",
              },
            });
          }
        }
      }

      const finalSignedUps = await tx.signedUp.findMany({
        where: {
          inscriptionId: existingPayment.inscriptionId,
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      const newGlobalStatus = getGlobalInscriptionStatus(
        finalSignedUps.map((item) => item.state)
      );

      await tx.inscription.update({
        where: { id: existingPayment.inscriptionId },
        data: {
          globalStatus: newGlobalStatus,
        },
      });

      return tx.payment.findUnique({
        where: { id: parsedId },
        include: {
          inscription: {
            include: {
              participant: true,
              payments: {
                include: {
                  paymentAllocations: true,
                },
                orderBy: {
                  createdAt: "asc",
                },
              },
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
            },
          },
          paymentAllocations: {
            include: {
              signedUp: {
                include: {
                  week: true,
                },
              },
            },
          },
        },
      });
    });

    res.json({
      message: "Pago registrado correctamente",
      payment: result,
    });
  } catch (error) {
    console.error("Error al registrar el pago:", error);
    res.status(500).json({
      error: error.message || "Error al registrar el pago",
    });
  }
};