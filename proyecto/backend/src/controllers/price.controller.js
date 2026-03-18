import prisma from "../lib/prisma.js";

const parsePositiveInt = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    return null;
  }

  return parsed;
};

const parseNonNegativeNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);

  if (Number.isNaN(parsed) || parsed < 0) {
    return null;
  }

  return parsed;
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

export const getPrices = async (req, res) => {
  try {
    const { summerCampId, number } = req.query;

    if (summerCampId === undefined) {
      return res.status(400).json({
        error: "Es obligatorio incluir summerCampId",
      });
    }

    const parsedSummerCampId = parsePositiveInt(summerCampId);
    if (parsedSummerCampId === null) {
      return res.status(400).json({
        error: "summerCampId debe ser un número entero mayor que 0",
      });
    }

    let parsedNumber;
    if (number !== undefined) {
      parsedNumber = parsePositiveInt(number);
      if (parsedNumber === null) {
        return res.status(400).json({
          error: "number debe ser un número entero mayor que 0",
        });
      }
    }

    const where = {
      week: {
        summerCampId: parsedSummerCampId,
        ...(parsedNumber !== undefined ? { number: parsedNumber } : {}),
      },
    };

    const prices = await prisma.price.findMany({
      where,
      orderBy: [
        { weekId: "asc" },
        { createdAt: "desc" },
      ],
      include: {
        week: {
          include: {
            summerCamp: true,
          },
        },
      },
    });

    res.json(prices);
  } catch (error) {
    console.error("Error al obtener precios:", error);
    res.status(500).json({ error: "Error al obtener precios" });
  }
};

export const createPrice = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    const {
      summerCampId,
      number,
      basePrice,
      disabilityPrice,
      earlyRisePrice,
      breakfastPrice,
      lunchPrice,
      validFrom,
      validTo,
      isActive,
      notes,
    } = req.body;

    if (
      summerCampId === undefined ||
      number === undefined ||
      basePrice === undefined ||
      disabilityPrice === undefined ||
      earlyRisePrice === undefined ||
      breakfastPrice === undefined ||
      lunchPrice === undefined
    ) {
      return res.status(400).json({
        error:
          "summerCampId, number, basePrice, disabilityPrice, earlyRisePrice, breakfastPrice y lunchPrice son obligatorios",
      });
    }

    if (validFrom !== undefined) {
      return res.status(400).json({
        error: "validFrom no puede enviarse al crear un precio",
      });
    }

    if (validTo !== undefined) {
      return res.status(400).json({
        error: "validTo no puede enviarse al crear un precio",
      });
    }

    if (isActive !== undefined) {
      return res.status(400).json({
        error: "isActive no puede enviarse al crear un precio",
      });
    }

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

    const parsedBasePrice = parseNonNegativeNumber(basePrice);
    const parsedDisabilityPrice = parseNonNegativeNumber(disabilityPrice);
    const parsedEarlyRisePrice = parseNonNegativeNumber(earlyRisePrice);
    const parsedBreakfastPrice = parseNonNegativeNumber(breakfastPrice);
    const parsedLunchPrice = parseNonNegativeNumber(lunchPrice);

    if (parsedBasePrice === null) {
      return res.status(400).json({
        error: "basePrice debe ser un número mayor o igual que 0",
      });
    }

    if (parsedDisabilityPrice === null) {
      return res.status(400).json({
        error: "disabilityPrice debe ser un número mayor o igual que 0",
      });
    }

    if (parsedEarlyRisePrice === null) {
      return res.status(400).json({
        error: "earlyRisePrice debe ser un número mayor o igual que 0",
      });
    }

    if (parsedBreakfastPrice === null) {
      return res.status(400).json({
        error: "breakfastPrice debe ser un número mayor o igual que 0",
      });
    }

    if (parsedLunchPrice === null) {
      return res.status(400).json({
        error: "lunchPrice debe ser un número mayor o igual que 0",
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
        error: "La semana indicada no existe en ese campamento",
      });
    }

    const existingPrice = await prisma.price.findFirst({
      where: {
        weekId: existingWeek.id,
      },
    });

    if (existingPrice) {
      return res.status(409).json({
        error:
          "La semana ya tiene precios. Debes usar updatePrice en lugar de createPrice",
      });
    }

    const now = new Date();

    const newPrice = await prisma.price.create({
      data: {
        basePrice: parsedBasePrice,
        disabilityPrice: parsedDisabilityPrice,
        earlyRisePrice: parsedEarlyRisePrice,
        breakfastPrice: parsedBreakfastPrice,
        lunchPrice: parsedLunchPrice,
        isActive: true,
        validFrom: now,
        validTo: null,
        notes: notes || null,
        weekId: existingWeek.id,
      },
    });

    res.status(201).json(newPrice);
  } catch (error) {
    console.error("Error al crear precio:", error);
    res.status(500).json({ error: "Error al crear precio" });
  }
};

export const updatePrice = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    const {
      summerCampId,
      number,
      basePrice,
      disabilityPrice,
      earlyRisePrice,
      breakfastPrice,
      lunchPrice,
      validFrom,
      validTo,
      isActive,
      notes,
    } = req.body;

    if (summerCampId === undefined || number === undefined) {
      return res.status(400).json({
        error: "summerCampId y number son obligatorios",
      });
    }

    if (validFrom !== undefined) {
      return res.status(400).json({
        error: "validFrom no puede modificarse manualmente en updatePrice",
      });
    }

    if (validTo !== undefined) {
      return res.status(400).json({
        error: "validTo no puede modificarse manualmente en updatePrice",
      });
    }

    if (isActive !== undefined) {
      return res.status(400).json({
        error: "isActive no puede modificarse manualmente en updatePrice",
      });
    }

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
    });

    if (!existingWeek) {
      return res.status(404).json({
        error: "La semana indicada no existe en ese campamento",
      });
    }

    const activePrices = await prisma.price.findMany({
      where: {
        weekId: existingWeek.id,
        isActive: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    if (activePrices.length === 0) {
      return res.status(404).json({
        error: "No existe un precio activo para esa semana",
      });
    }

    if (activePrices.length > 1) {
      return res.status(409).json({
        error: "Hay más de un precio activo para esa semana. Los datos son inconsistentes",
      });
    }

    const activePrice = activePrices[0];

    const onlyNotesUpdate =
      basePrice === undefined &&
      disabilityPrice === undefined &&
      earlyRisePrice === undefined &&
      breakfastPrice === undefined &&
      lunchPrice === undefined &&
      notes !== undefined;

    if (onlyNotesUpdate) {
      const updatedNotesPrice = await prisma.price.update({
        where: { id: activePrice.id },
        data: {
          notes: notes || null,
        },
      });

      return res.json({
        message: "Notas del precio actualizadas correctamente",
        updatedPrice: updatedNotesPrice,
      });
    }

    if (
      basePrice === undefined ||
      disabilityPrice === undefined ||
      earlyRisePrice === undefined ||
      breakfastPrice === undefined ||
      lunchPrice === undefined
    ) {
      return res.status(400).json({
        error:
          "Para crear un nuevo precio debes enviar basePrice, disabilityPrice, earlyRisePrice, breakfastPrice y lunchPrice. Si solo quieres cambiar notes, envía únicamente notes",
      });
    }

    const parsedBasePrice = parseNonNegativeNumber(basePrice);
    const parsedDisabilityPrice = parseNonNegativeNumber(disabilityPrice);
    const parsedEarlyRisePrice = parseNonNegativeNumber(earlyRisePrice);
    const parsedBreakfastPrice = parseNonNegativeNumber(breakfastPrice);
    const parsedLunchPrice = parseNonNegativeNumber(lunchPrice);

    if (parsedBasePrice === null) {
      return res.status(400).json({
        error: "basePrice debe ser un número mayor o igual que 0",
      });
    }

    if (parsedDisabilityPrice === null) {
      return res.status(400).json({
        error: "disabilityPrice debe ser un número mayor o igual que 0",
      });
    }

    if (parsedEarlyRisePrice === null) {
      return res.status(400).json({
        error: "earlyRisePrice debe ser un número mayor o igual que 0",
      });
    }

    if (parsedBreakfastPrice === null) {
      return res.status(400).json({
        error: "breakfastPrice debe ser un número mayor o igual que 0",
      });
    }

    if (parsedLunchPrice === null) {
      return res.status(400).json({
        error: "lunchPrice debe ser un número mayor o igual que 0",
      });
    }

    const now = new Date();

    const result = await prisma.$transaction(async (tx) => {
      const deactivatedPrice = await tx.price.update({
        where: { id: activePrice.id },
        data: {
          isActive: false,
          validTo: now,
        },
      });

      const newPrice = await tx.price.create({
        data: {
          basePrice: parsedBasePrice,
          disabilityPrice: parsedDisabilityPrice,
          earlyRisePrice: parsedEarlyRisePrice,
          breakfastPrice: parsedBreakfastPrice,
          lunchPrice: parsedLunchPrice,
          isActive: true,
          validFrom: now,
          validTo: null,
          notes: notes || null,
          weekId: existingWeek.id,
        },
      });

      return { deactivatedPrice, newPrice };
    });

    res.json({
      message: "Precio actualizado correctamente",
      previousPriceId: result.deactivatedPrice.id,
      newPrice: result.newPrice,
    });
  } catch (error) {
    console.error("Error al actualizar precio:", error);
    res.status(500).json({ error: "Error al actualizar precio" });
  }
};