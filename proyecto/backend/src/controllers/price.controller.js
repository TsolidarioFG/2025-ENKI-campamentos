import prisma from "../lib/prisma.js";

export const getPrices = async (req, res) => {
  try {
    const { summerCampId, number } = req.validatedQuery;

    const where = {
      week: {
        summerCampId,
        ...(number !== undefined ? { number } : {}),
      },
    };

    const prices = await prisma.price.findMany({
      where,
      orderBy: [{ weekId: "asc" }, { createdAt: "desc" }],
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
    const {
      summerCampId,
      number,
      basePrice,
      disabilityPrice,
      earlyRisePrice,
      breakfastPrice,
      lunchPrice,
      notes,
    } = req.validatedBody;

    const existingWeek = await prisma.week.findUnique({
      where: {
        summerCampId_number: {
          summerCampId,
          number,
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
        basePrice,
        disabilityPrice,
        earlyRisePrice,
        breakfastPrice,
        lunchPrice,
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
    const {
      summerCampId,
      number,
      basePrice,
      disabilityPrice,
      earlyRisePrice,
      breakfastPrice,
      lunchPrice,
      notes,
    } = req.validatedBody;

    const existingWeek = await prisma.week.findUnique({
      where: {
        summerCampId_number: {
          summerCampId,
          number,
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
        error:
          "Hay más de un precio activo para esa semana. Los datos son inconsistentes",
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
          basePrice,
          disabilityPrice,
          earlyRisePrice,
          breakfastPrice,
          lunchPrice,
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