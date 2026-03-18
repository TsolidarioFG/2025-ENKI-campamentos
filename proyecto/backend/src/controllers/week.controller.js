import prisma from "../lib/prisma.js";

const parsePositiveInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) return null;
  return parsed;
};

const parseNonNegativeInt = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0) return null;
  return parsed;
};

const parseBooleanStrict = (value) => {
  if (typeof value === "boolean") return value;
  return null;
};

const parseNonNegativeNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return null;
  return parsed;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const getWeeks = async (req, res) => {
  try {
    const { summerCampId, number } = req.query;

    if (number !== undefined && summerCampId === undefined) {
      return res.status(400).json({
        error: "Para filtrar por semana es necesario incluir el id del campamento asociado",
      });
    }

    const where = {};

    if (summerCampId !== undefined) {
      const parsedSummerCampId = parsePositiveInt(summerCampId);
      if (parsedSummerCampId === null) {
        return res.status(400).json({
          error: "summerCampId debe ser un número entero mayor que 0",
        });
      }
      where.summerCampId = parsedSummerCampId;
    }

    if (number !== undefined) {
      const parsedNumber = parsePositiveInt(number);
      if (parsedNumber === null) {
        return res.status(400).json({
          error: "number debe ser un número entero mayor que 0",
        });
      }
      where.number = parsedNumber;
    }

    const weeks = await prisma.week.findMany({
      where,
      orderBy: [
        { summerCampId: "asc" },
        { number: "asc" }
      ],
      include: { summerCamp: true, prices: true },
    });

    res.json(weeks);
  } catch (error) {
    console.error("Error al obtener las semanas:", error);
    res.status(500).json({ error: "Error al obtener las semanas" });
  }
};

export const createWeek = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    const {
      summerCampId,
      totalPlaces,
      totalDisabilityPlaces,
      priceDefaults,
    } = req.body;

    if (summerCampId === undefined) {
      return res.status(400).json({
        error: "summerCampId es obligatorio",
      });
    }

    const parsedSummerCampId = parsePositiveInt(summerCampId);
    if (parsedSummerCampId === null) {
      return res.status(400).json({
        error: "summerCampId debe ser un número entero mayor que 0",
      });
    }

    let parsedTotalPlaces;
    if (totalPlaces !== undefined) {
      parsedTotalPlaces = parseNonNegativeInt(totalPlaces);
      if (parsedTotalPlaces === null) {
        return res.status(400).json({
          error: "totalPlaces debe ser un número entero mayor o igual que 0",
        });
      }
    }

    let parsedTotalDisabilityPlaces;
    if (totalDisabilityPlaces !== undefined) {
      parsedTotalDisabilityPlaces = parseNonNegativeInt(totalDisabilityPlaces);
      if (parsedTotalDisabilityPlaces === null) {
        return res.status(400).json({
          error: "totalDisabilityPlaces debe ser un número entero mayor o igual que 0",
        });
      }
    }

    let parsedPriceDefaults = null;
    if (priceDefaults !== undefined) {
      if (typeof priceDefaults !== "object" || priceDefaults === null) {
        return res.status(400).json({
          error: "priceDefaults debe ser un objeto válido",
        });
      }

      parsedPriceDefaults = {
        basePrice: parseNonNegativeNumber(priceDefaults.basePrice),
        disabilityPrice: parseNonNegativeNumber(priceDefaults.disabilityPrice),
        earlyRisePrice: parseNonNegativeNumber(priceDefaults.earlyRisePrice),
        breakfastPrice: parseNonNegativeNumber(priceDefaults.breakfastPrice),
        lunchPrice: parseNonNegativeNumber(priceDefaults.lunchPrice),
      };

      if (parsedPriceDefaults.basePrice === null) {
        return res.status(400).json({
          error: "basePrice debe ser un número mayor o igual que 0",
        });
      }
      if (parsedPriceDefaults.disabilityPrice === null) {
        return res.status(400).json({
          error: "disabilityPrice debe ser un número mayor o igual que 0",
        });
      }
      if (parsedPriceDefaults.earlyRisePrice === null) {
        return res.status(400).json({
          error: "earlyRisePrice debe ser un número mayor o igual que 0",
        });
      }
      if (parsedPriceDefaults.breakfastPrice === null) {
        return res.status(400).json({
          error: "breakfastPrice debe ser un número mayor o igual que 0",
        });
      }
      if (parsedPriceDefaults.lunchPrice === null) {
        return res.status(400).json({
          error: "lunchPrice debe ser un número mayor o igual que 0",
        });
      }
    }

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id: parsedSummerCampId },
      include: {
        weeks: {
          orderBy: { number: "asc" },
          include: {
            prices: {
              where: { isActive: true },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    if (!existingCamp) {
      return res.status(404).json({
        error: "El campamento indicado no existe",
      });
    }

    const lastWeek = existingCamp.weeks[existingCamp.weeks.length - 1];

    if (!lastWeek) {
      return res.status(409).json({
        error: "El campamento no tiene semanas. Debe crearse desde createSummerCamp",
      });
    }

    const finalTotalPlaces =
      parsedTotalPlaces !== undefined
        ? parsedTotalPlaces
        : existingCamp.defaultTotalPlaces;

    const finalTotalDisabilityPlaces =
      parsedTotalDisabilityPlaces !== undefined
        ? parsedTotalDisabilityPlaces
        : existingCamp.defaultTotalDisabilityPlaces;

    const newWeekNumber = lastWeek.number + 1;
    const newStartDate = addDays(lastWeek.endDate, 1);
    const newEndDate = addDays(newStartDate, 6);

    let finalPriceDefaults;
    if (parsedPriceDefaults) {
      finalPriceDefaults = parsedPriceDefaults;
    } else {
      finalPriceDefaults = {
        basePrice: existingCamp.defaultBasePrice,
        disabilityPrice: existingCamp.defaultDisabilityPrice,
        earlyRisePrice: existingCamp.defaultEarlyRisePrice,
        breakfastPrice: existingCamp.defaultBreakfastPrice,
        lunchPrice: existingCamp.defaultLunchPrice,
      };
    }

    const result = await prisma.$transaction(async (tx) => {
      const week = await tx.week.create({
        data: {
          number: newWeekNumber,
          startDate: newStartDate,
          endDate: newEndDate,
          totalPlaces: finalTotalPlaces,
          availablePlaces: finalTotalPlaces,
          totalDisabilityPlaces: finalTotalDisabilityPlaces,
          availableDisabilityPlaces: finalTotalDisabilityPlaces,
          active: true,
          summerCampId: parsedSummerCampId,
        },
      });

      await tx.price.create({
        data: {
          basePrice: finalPriceDefaults.basePrice,
          disabilityPrice: finalPriceDefaults.disabilityPrice,
          earlyRisePrice: finalPriceDefaults.earlyRisePrice,
          breakfastPrice: finalPriceDefaults.breakfastPrice,
          lunchPrice: finalPriceDefaults.lunchPrice,
          isActive: true,
          validFrom: new Date(),
          validTo: null,
          notes: null,
          weekId: week.id,
        },
      });

      await tx.summerCamp.update({
        where: { id: parsedSummerCampId },
        data: {
          endDate: newEndDate,
        },
      });

      return tx.week.findUnique({
        where: { id: week.id },
        include: { prices: true, summerCamp: true },
      });
    });

    res.status(201).json(result);
  } catch (error) {
    console.error("Error al crear semana:", error);
    res.status(500).json({ error: "Error al crear semana" });
  }
};

export const updateWeek = async (req, res) => {
  try {
    const { summerCampId, number } = req.params;

    const parsedSummerCampId = parsePositiveInt(summerCampId);
    const parsedNumber = parsePositiveInt(number);

    if (parsedSummerCampId === null) {
      return res.status(400).json({
        error: "summerCampId debe ser un número entero mayor que 0",
      });
    }

    if (parsedNumber === null) {
      return res.status(400).json({
        error: "number debe ser un número entero mayor que 0",
      });
    }

    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    if (
      req.body.id !== undefined ||
      req.body.number !== undefined ||
      req.body.createdAt !== undefined ||
      req.body.summerCampId !== undefined
    ) {
      return res.status(400).json({
        error: "No se pueden modificar id, number, createdAt ni summerCampId",
      });
    }

    const existingWeek = await prisma.week.findUnique({
      where: {
        summerCampId_number: {
          summerCampId: parsedSummerCampId,
          number: parsedNumber,
        },
      },
      include: {
        signedUpWeeks: true,
      },
    });

    if (!existingWeek) {
      return res.status(404).json({
        error: "La semana no existe en ese campamento",
      });
    }

    const {
      totalPlaces,
      availablePlaces,
      totalDisabilityPlaces,
      availableDisabilityPlaces,
      active,
    } = req.body;

    let parsedTotalPlaces = existingWeek.totalPlaces;
    if (totalPlaces !== undefined) {
      parsedTotalPlaces = parseNonNegativeInt(totalPlaces);
      if (parsedTotalPlaces === null) {
        return res.status(400).json({
          error: "totalPlaces debe ser un número entero mayor o igual que 0",
        });
      }
    }

    let parsedAvailablePlaces = existingWeek.availablePlaces;
    if (availablePlaces !== undefined) {
      parsedAvailablePlaces = parseNonNegativeInt(availablePlaces);
      if (parsedAvailablePlaces === null) {
        return res.status(400).json({
          error: "availablePlaces debe ser un número entero mayor o igual que 0",
        });
      }
    }

    if (parsedAvailablePlaces > parsedTotalPlaces) {
      return res.status(400).json({
        error: "availablePlaces no puede ser mayor que totalPlaces",
      });
    }

    let parsedTotalDisabilityPlaces = existingWeek.totalDisabilityPlaces;
    if (totalDisabilityPlaces !== undefined) {
      parsedTotalDisabilityPlaces = parseNonNegativeInt(totalDisabilityPlaces);
      if (parsedTotalDisabilityPlaces === null) {
        return res.status(400).json({
          error: "totalDisabilityPlaces debe ser un número entero mayor o igual que 0",
        });
      }
    }

    let parsedAvailableDisabilityPlaces = existingWeek.availableDisabilityPlaces;
    if (availableDisabilityPlaces !== undefined) {
      parsedAvailableDisabilityPlaces = parseNonNegativeInt(availableDisabilityPlaces);
      if (parsedAvailableDisabilityPlaces === null) {
        return res.status(400).json({
          error: "availableDisabilityPlaces debe ser un número entero mayor o igual que 0",
        });
      }
    }

    if (parsedAvailableDisabilityPlaces > parsedTotalDisabilityPlaces) {
      return res.status(400).json({
        error: "availableDisabilityPlaces no puede ser mayor que totalDisabilityPlaces",
      });
    }

    // NUEVAS COMPROBACIONES DE COHERENCIA CON PLAZAS YA OCUPADAS
    const occupiedPlaces = existingWeek.totalPlaces - existingWeek.availablePlaces;
    const occupiedDisabilityPlaces =
      existingWeek.totalDisabilityPlaces - existingWeek.availableDisabilityPlaces;

    if (parsedTotalPlaces < occupiedPlaces) {
      return res.status(400).json({
        error: "totalPlaces no puede ser menor que las plazas ya ocupadas",
      });
    }

    if (parsedTotalDisabilityPlaces < occupiedDisabilityPlaces) {
      return res.status(400).json({
        error:
          "totalDisabilityPlaces no puede ser menor que las plazas de discapacidad ya ocupadas",
      });
    }

    if (parsedAvailablePlaces < 0 || parsedAvailableDisabilityPlaces < 0) {
      return res.status(400).json({
        error: "Las plazas disponibles no pueden ser negativas",
      });
    }

    let parsedActive;
    if (active !== undefined) {
      parsedActive = parseBooleanStrict(active);
      if (parsedActive === null) {
        return res.status(400).json({
          error: "active debe ser booleano",
        });
      }
    }

    const updatedWeek = await prisma.week.update({
      where: { id: existingWeek.id },
      data: {
        ...(totalPlaces !== undefined && { totalPlaces: parsedTotalPlaces }),
        ...(availablePlaces !== undefined && { availablePlaces: parsedAvailablePlaces }),
        ...(totalDisabilityPlaces !== undefined && {
          totalDisabilityPlaces: parsedTotalDisabilityPlaces,
        }),
        ...(availableDisabilityPlaces !== undefined && {
          availableDisabilityPlaces: parsedAvailableDisabilityPlaces,
        }),
        ...(active !== undefined && { active: parsedActive }),
      },
    });

    res.json(updatedWeek);
  } catch (error) {
    console.error("Error al actualizar semana:", error);
    res.status(500).json({ error: "Error al actualizar semana" });
  }
};

export const deleteWeek = async (req, res) => {
  try {
    const { summerCampId, number } = req.params;

    const parsedSummerCampId = parsePositiveInt(summerCampId);
    const parsedNumber = parsePositiveInt(number);

    if (parsedSummerCampId === null) {
      return res.status(400).json({
        error: "summerCampId debe ser un número entero mayor que 0",
      });
    }

    if (parsedNumber === null) {
      return res.status(400).json({
        error: "number debe ser un número entero mayor que 0",
      });
    }

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id: parsedSummerCampId },
      include: {
        weeks: {
          orderBy: { number: "asc" },
          include: {
            signedUpWeeks: true,
          },
        },
      },
    });

    if (!existingCamp) {
      return res.status(404).json({
        error: "El campamento no existe",
      });
    }

    const existingWeek = existingCamp.weeks.find((w) => w.number === parsedNumber);

    if (!existingWeek) {
      return res.status(404).json({
        error: "La semana no existe en ese campamento",
      });
    }

    if (existingCamp.weeks.length === 1) {
      return res.status(409).json({
        error: "No se puede eliminar la única semana del campamento",
      });
    }

    const lastWeek = existingCamp.weeks[existingCamp.weeks.length - 1];

    if (existingWeek.id !== lastWeek.id) {
      return res.status(409).json({
        error: "Solo se puede eliminar la última semana del campamento",
      });
    }

    if (existingWeek.signedUpWeeks.length > 0) {
      return res.status(409).json({
        error: "No se puede eliminar la semana porque tiene inscripciones asociadas",
      });
    }

    const previousWeek = existingCamp.weeks[existingCamp.weeks.length - 2];

    await prisma.$transaction(async (tx) => {
      await tx.price.deleteMany({
        where: {
          weekId: existingWeek.id,
        },
      });

      await tx.week.delete({
        where: { id: existingWeek.id },
      });

      await tx.summerCamp.update({
        where: { id: parsedSummerCampId },
        data: {
          endDate: previousWeek.endDate,
        },
      });
    });

    res.json({ message: "Semana eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar semana:", error);
    res.status(500).json({ error: "Error al eliminar semana" });
  }
};