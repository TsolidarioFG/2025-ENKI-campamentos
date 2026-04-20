import prisma from "../lib/prisma.js";
import {
  getApplicableDiscountsForInscription,
  applyDiscountsToAmount,
} from "../services/discount.service.js";

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
    const { inscriptionId, status, paymentType } = req.validatedQuery;

    const where = {};

    if (inscriptionId !== undefined) {
      where.inscriptionId = inscriptionId;
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
    const { id } = req.validatedParams;

    const payment = await prisma.payment.findUnique({
      where: { id },
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
    } = req.validatedBody;

    const finalDueDate = dueDate ?? null;

    const result = await prisma.$transaction(async (tx) => {
      const signedUp = await tx.signedUp.findUnique({
        where: {
          inscriptionId_weekId: {
            inscriptionId,
            weekId,
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

      const applicableDiscounts = await getApplicableDiscountsForInscription(
        tx,
        inscriptionId
      );

      const discountResult = applyDiscountsToAmount(amount, applicableDiscounts);
      const finalExtraAmount = discountResult.finalAmount;

      if (paymentMode === "ONE_PAYMENT") {
        const payment = await tx.payment.create({
          data: {
            paymentType: "EXTRA",
            status: "PENDING",
            amount: finalExtraAmount,
            concept:
              concept ||
              `Pago extra ${purpose} para semana ${signedUp.week.number}`,
            dueDate: finalDueDate,
            receiptRequested: receiptRequested ?? false,
            isMandatory: isMandatory ?? true,
            notes: notes || null,
            inscriptionId,
          },
        });

        await tx.paymentSignedUp.create({
          data: {
            paymentId: payment.id,
            inscriptionId,
            weekId,
            purpose,
            amount: finalExtraAmount,
            notes: notes || null,
          },
        });
      }

      if (paymentMode === "TWO_PAYMENTS") {
        const [firstAmount, secondAmount] = splitAmountInTwo(finalExtraAmount);

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
            inscriptionId,
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
            inscriptionId,
          },
        });

        await tx.paymentSignedUp.create({
          data: {
            paymentId: firstPayment.id,
            inscriptionId,
            weekId,
            purpose,
            amount: firstAmount,
            notes: notes || null,
          },
        });

        await tx.paymentSignedUp.create({
          data: {
            paymentId: secondPayment.id,
            inscriptionId,
            weekId,
            purpose,
            amount: secondAmount,
            notes: notes || null,
          },
        });
      }

      const updatedInscription = await tx.inscription.update({
        where: { id: inscriptionId },
        data: {
          totalAmountExpected:
            signedUp.inscription.totalAmountExpected + finalExtraAmount,
          totalAmountPending:
            signedUp.inscription.totalAmountPending + finalExtraAmount,
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
          appliedDiscounts: {
            include: {
              discount: true,
            },
          },
        },
      });
    });

    return res.status(201).json({
      message: "Pago extra creado correctamente",
      inscription: result,
    });
  } catch (error) {
    console.error("Error al crear el pago extra:", error);
    return res.status(500).json({
      error: error.message || "Error al crear el pago extra",
    });
  }
};

export const registerPayment = async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const { method, paidAt, notes } = req.validatedBody;

    const finalPaidAt = paidAt ?? new Date();

    const result = await prisma.$transaction(async (tx) => {
      const existingPayment = await tx.payment.findUnique({
        where: { id },
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
        where: { id },
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
        if (payment.id === id) {
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
        const allReservationAllocationsForSignedUp =
          await tx.paymentSignedUp.findMany({
            where: {
              inscriptionId: allocation.inscriptionId,
              weekId: allocation.weekId,
              purpose: "RESERVATION",
            },
            include: {
              payment: true,
            },
          });

        const fullyPaid = allReservationAllocationsForSignedUp.every((item) =>
          item.payment.id === id ? true : item.payment.status === "PAID"
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
        where: { id },
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