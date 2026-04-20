import prisma from "../lib/prisma.js";

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

export const getWeeks = async (req, res) => {
  try {
    const { summerCampId, number } = req.validatedQuery;

    const where = {};

    if (summerCampId !== undefined) {
      where.summerCampId = summerCampId;
    }

    if (number !== undefined) {
      where.number = number;
    }

    const weeks = await prisma.week.findMany({
      where,
      orderBy: [{ summerCampId: "asc" }, { number: "asc" }],
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
    const {
      summerCampId,
      totalPlaces,
      totalDisabilityPlaces,
      priceDefaults,
    } = req.validatedBody;

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id: summerCampId },
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
      totalPlaces !== undefined
        ? totalPlaces
        : existingCamp.defaultTotalPlaces;

    const finalTotalDisabilityPlaces =
      totalDisabilityPlaces !== undefined
        ? totalDisabilityPlaces
        : existingCamp.defaultTotalDisabilityPlaces;

    const newWeekNumber = lastWeek.number + 1;
    const newStartDate = addDays(lastWeek.endDate, 1);
    const newEndDate = addDays(newStartDate, 6);

    let finalPriceDefaults;
    if (priceDefaults) {
      finalPriceDefaults = priceDefaults;
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
          summerCampId,
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
        where: { id: summerCampId },
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
    res.status(500).json({ error: error.message || "Error al crear semana" });
  }
};

export const updateWeek = async (req, res) => {
  try {
    const { summerCampId, number } = req.validatedParams;
    const {
      totalPlaces,
      availablePlaces,
      totalDisabilityPlaces,
      availableDisabilityPlaces,
      active,
    } = req.validatedBody;

    const existingWeek = await prisma.week.findUnique({
      where: {
        summerCampId_number: {
          summerCampId,
          number,
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

    const finalTotalPlaces =
      totalPlaces !== undefined ? totalPlaces : existingWeek.totalPlaces;

    const finalAvailablePlaces =
      availablePlaces !== undefined ? availablePlaces : existingWeek.availablePlaces;

    const finalTotalDisabilityPlaces =
      totalDisabilityPlaces !== undefined
        ? totalDisabilityPlaces
        : existingWeek.totalDisabilityPlaces;

    const finalAvailableDisabilityPlaces =
      availableDisabilityPlaces !== undefined
        ? availableDisabilityPlaces
        : existingWeek.availableDisabilityPlaces;

    const occupiedPlaces = existingWeek.totalPlaces - existingWeek.availablePlaces;
    const occupiedDisabilityPlaces =
      existingWeek.totalDisabilityPlaces - existingWeek.availableDisabilityPlaces;

    if (finalTotalPlaces < occupiedPlaces) {
      return res.status(400).json({
        error: "totalPlaces no puede ser menor que las plazas ya ocupadas",
      });
    }

    if (finalTotalDisabilityPlaces < occupiedDisabilityPlaces) {
      return res.status(400).json({
        error:
          "totalDisabilityPlaces no puede ser menor que las plazas de discapacidad ya ocupadas",
      });
    }

    const updatedWeek = await prisma.week.update({
      where: { id: existingWeek.id },
      data: {
        ...(totalPlaces !== undefined && { totalPlaces: finalTotalPlaces }),
        ...(availablePlaces !== undefined && {
          availablePlaces: finalAvailablePlaces,
        }),
        ...(totalDisabilityPlaces !== undefined && {
          totalDisabilityPlaces: finalTotalDisabilityPlaces,
        }),
        ...(availableDisabilityPlaces !== undefined && {
          availableDisabilityPlaces: finalAvailableDisabilityPlaces,
        }),
        ...(active !== undefined && { active }),
      },
    });

    res.json(updatedWeek);
  } catch (error) {
    console.error("Error al actualizar semana:", error);
    res.status(500).json({ error: error.message || "Error al actualizar semana" });
  }
};

export const deleteWeek = async (req, res) => {
  try {
    const { summerCampId, number } = req.validatedParams;

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id: summerCampId },
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

    const existingWeek = existingCamp.weeks.find((w) => w.number === number);

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
        where: { id: summerCampId },
        data: {
          endDate: previousWeek.endDate,
        },
      });
    });

    res.json({ message: "Semana eliminada correctamente" });
  } catch (error) {
    console.error("Error al eliminar semana:", error);
    res.status(500).json({ error: error.message || "Error al eliminar semana" });
  }
};