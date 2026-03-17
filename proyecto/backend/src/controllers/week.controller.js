import prisma from "../lib/prisma.js";
const parsePositiveInt = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseNonNegativeInt = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
};

const parseBooleanStrict = (value) => {
  if (typeof value === "boolean") return value;
  return null;
};

const parseDateOrNull = (value) => {
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return "INVALID_DATE";
  }

  return parsed;
};
export const getWeeks = async (req, res) => {
  try {
    const { summerCampId, number } = req.query;

    if (number && !summerCampId) {
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
  }
  catch (error) {
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
      number,
      startDate,
      endDate,
      totalPlaces,
      availablePlaces,
      totalDisabilityPlaces,
      availableDisabilityPlaces,
      active,
      summerCampId
    } = req.body;

    if (
      number === undefined ||
      totalPlaces === undefined ||
      totalDisabilityPlaces === undefined ||
      summerCampId === undefined
    ) {
      return res.status(400).json({
        error: "number, totalPlaces, totalDisabilityPlaces y summerCampId son obligatorios",
      });
    }

    const parsedNumber = parsePositiveInt(number);
    const parsedSummerCampId = parsePositiveInt(summerCampId);
    const parsedTotalPlaces = parseNonNegativeInt(totalPlaces);
    const parsedTotalDisabilityPlaces = parseNonNegativeInt(totalDisabilityPlaces);

    if (parsedNumber === null) {
      return res.status(400).json({
        error: "number debe ser un número entero mayor que 0",
      });
    }

    if (parsedSummerCampId === null) {
      return res.status(400).json({
        error: "summerCampId debe ser un número entero mayor que 0",
      });
    }

    if (parsedTotalPlaces === null) {
    return res.status(400).json({
        error: "totalPlaces debe ser un número entero mayor o igual que 0",
    });
    }

    if (parsedTotalDisabilityPlaces === null) {
    return res.status(400).json({
        error: "totalDisabilityPlaces debe ser un número entero mayor o igual que 0",
    });
    }

    const parsedAvailablePlaces =
      availablePlaces !== undefined
        ? parseNonNegativeInt(availablePlaces)
        : parsedTotalPlaces;

    if (parsedAvailablePlaces === null) {
      return res.status(400).json({
        error: "availablePlaces debe ser un número entero mayor o igual que 0",
      });
    }

    if (parsedAvailablePlaces > parsedTotalPlaces) {
      return res.status(400).json({
        error: "availablePlaces no puede ser mayor que totalPlaces",
      });
    }

    const parsedAvailableDisabilityPlaces =
      availableDisabilityPlaces !== undefined
        ? parseNonNegativeInt(availableDisabilityPlaces)
        : parsedTotalDisabilityPlaces;

    if (parsedAvailableDisabilityPlaces === null) {
      return res.status(400).json({
        error: "availableDisabilityPlaces debe ser un número entero mayor o igual que 0",
      });
    }

    if (parsedAvailableDisabilityPlaces > parsedTotalDisabilityPlaces) {
      return res.status(400).json({
        error: "availableDisabilityPlaces no puede ser mayor que totalDisabilityPlaces",
      });
    }

    const parsedActive =
      active !== undefined ? parseBooleanStrict(active) : true;

    if (active !== undefined && parsedActive === null) {
      return res.status(400).json({
        error: "active debe ser booleano",
      });
    }

    const parsedStartDate = parseDateOrNull(startDate);
    const parsedEndDate = parseDateOrNull(endDate);

    if (parsedStartDate === "INVALID_DATE") {
      return res.status(400).json({
        error: "startDate no es una fecha válida",
      });
    }

    if (parsedEndDate === "INVALID_DATE") {
      return res.status(400).json({
        error: "endDate no es una fecha válida",
      });
    }

    if (parsedStartDate && parsedEndDate && parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        error: "endDate debe ser posterior a startDate",
      });
    }

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id: parsedSummerCampId },
    });

    if (!existingCamp) {
      return res.status(404).json({
        error: "El campamento indicado no existe",
      });
    }

    const existingWeek = await prisma.week.findUnique({
      where: {
        summerCampId_number: {
          summerCampId: parsedSummerCampId,
          number: parsedNumber,
        },
      }
    });

    if (existingWeek) {
      return res.status(409).json({
        error: "La semana ya ha sido creada",
      });
    }

    const newWeek = await prisma.week.create({
      data: {
        number: parsedNumber,
        startDate: parsedStartDate ?? null,
        endDate: parsedEndDate ?? null,
        totalPlaces: parsedTotalPlaces,
        availablePlaces: parsedAvailablePlaces,
        totalDisabilityPlaces: parsedTotalDisabilityPlaces,
        availableDisabilityPlaces: parsedAvailableDisabilityPlaces,
        active: parsedActive,
        summerCampId: parsedSummerCampId,
      },
    });

    res.status(201).json(newWeek);
  }
  catch (error) {
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
    });

    if (!existingWeek) {
      return res.status(404).json({
        error: "La semana no existe en ese campamento",
      });
    }

    const {
      startDate,
      endDate,
      totalPlaces,
      availablePlaces,
      totalDisabilityPlaces,
      availableDisabilityPlaces,
      active,
    } = req.body;

    const parsedStartDate = parseDateOrNull(startDate);
    const parsedEndDate = parseDateOrNull(endDate);

    if (parsedStartDate === "INVALID_DATE") {
      return res.status(400).json({
        error: "startDate no es una fecha válida",
      });
    }

    if (parsedEndDate === "INVALID_DATE") {
      return res.status(400).json({
        error: "endDate no es una fecha válida",
      });
    }

    const finalStartDate =
      parsedStartDate !== undefined ? parsedStartDate : existingWeek.startDate;
    const finalEndDate =
      parsedEndDate !== undefined ? parsedEndDate : existingWeek.endDate;

    if (finalStartDate && finalEndDate && finalEndDate <= finalStartDate) {
      return res.status(400).json({
        error: "endDate debe ser posterior a startDate",
      });
    }

    let parsedTotalPlaces = existingWeek.totalPlaces;
    if (totalPlaces !== undefined) {
      parsedTotalPlaces = parseNonNegativeInt(totalPlaces);
      if (parsedTotalPlaces === null) {
        return res.status(400).json({
          error: "totalPlaces debe ser un número entero mayor que 0",
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
        ...(startDate !== undefined && {
          startDate: parsedStartDate,
        }),
        ...(endDate !== undefined && {
          endDate: parsedEndDate,
        }),
        ...(totalPlaces !== undefined && {
          totalPlaces: parsedTotalPlaces,
        }),
        ...(availablePlaces !== undefined && {
          availablePlaces: parsedAvailablePlaces,
        }),
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

//need to check what happens on delete to inscriptions associated
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

    if (existingWeek.signedUpWeeks.length > 0) {
      return res.status(409).json({
        error: "No se puede eliminar la semana porque tiene inscripciones asociadas",
      });
    }

    await prisma.week.delete({
      where: { id: existingWeek.id },
    });

    res.json({ message: "Semana eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar semana:", error);
    res.status(500).json({ error: "Error al eliminar semana" });
  }
};