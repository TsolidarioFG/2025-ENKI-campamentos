import prisma from "../lib/prisma.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const computeWeekRanges = (startDate, endDate) => {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);

  if (end < start) return [];

  const ranges = [];
  let currentStart = start;
  let number = 1;

  while (currentStart <= end) {
    let currentEnd = addDays(currentStart, 6);
    if (currentEnd > end) currentEnd = end;

    ranges.push({
      number,
      startDate: new Date(currentStart),
      endDate: new Date(currentEnd),
    });

    currentStart = addDays(currentEnd, 1);
    number += 1;
  }

  return ranges;
};

export const getSummerCamps = async (req, res) => {
  try {
    const camps = await prisma.summerCamp.findMany({
  orderBy: {
    year: "desc",
  },
  include: {
    weeks: {
      orderBy: {
        number: "asc",
      },
      include: {
        prices: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    },
  },
});

    res.json(camps);
  } catch (error) {
    console.error("Error al obtener campamentos:", error);
    res.status(500).json({ error: "Error al obtener campamentos" });
  }
};

export const getSummerCamp = async (req, res) => {
  try {
    const { name, year } = req.validatedQuery;

    const where = {};

    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    if (year !== undefined) {
      where.year = year;
    }

    const camps = await prisma.summerCamp.findMany({
  where,
  orderBy: {
    year: "desc",
  },
  include: {
    weeks: {
      orderBy: {
        number: "asc",
      },
      include: {
        prices: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    },
  },
});

    res.json(camps);
  } catch (error) {
    console.error("Error al obtener campamento:", error);
    res.status(500).json({ error: "Error al obtener campamento" });
  }
};

export const createSummerCamp = async (req, res) => {
  try {
    const {
      name,
      place,
      year,
      description,
      startDate,
      endDate,
      inscriptionOpenDate,
      inscriptionCloseDate,
      formEnabled = true,
      isActive = true,
      weekDefaults,
      priceDefaults,
    } = req.validatedBody;

    const weekRanges = computeWeekRanges(startDate, endDate);

    if (weekRanges.length === 0) {
      return res.status(400).json({
        error: "El campamento debe generar al menos una semana",
      });
    }
    const existingYear = await prisma.summerCamp.findUnique({
      where: {
        year,
      },
    });

    if (existingYear) {
      return res.status(409).json({
        error: "Ya existe un campamento para ese año",
      });
    }
    const createdCamp = await prisma.$transaction(async (tx) => {
      const camp = await tx.summerCamp.create({
        data: {
          name,
          place,
          year,
          description: description || null,
          startDate,
          endDate,
          inscriptionOpenDate: inscriptionOpenDate ?? null,
          inscriptionCloseDate: inscriptionCloseDate ?? null,
          formEnabled,
          isActive,
          defaultTotalPlaces: weekDefaults.totalPlaces,
          defaultTotalDisabilityPlaces: weekDefaults.totalDisabilityPlaces,
          defaultBasePrice: priceDefaults.basePrice,
          defaultDisabilityPrice: priceDefaults.disabilityPrice,
          defaultEarlyRisePrice: priceDefaults.earlyRisePrice,
          defaultBreakfastPrice: priceDefaults.breakfastPrice,
          defaultLunchPrice: priceDefaults.lunchPrice,
        },
      });

      for (const weekRange of weekRanges) {
        const week = await tx.week.create({
          data: {
            number: weekRange.number,
            startDate: weekRange.startDate,
            endDate: weekRange.endDate,
            totalPlaces: weekDefaults.totalPlaces,
            availablePlaces: weekDefaults.totalPlaces,
            totalDisabilityPlaces: weekDefaults.totalDisabilityPlaces,
            availableDisabilityPlaces: weekDefaults.totalDisabilityPlaces,
            active: true,
            summerCampId: camp.id,
          },
        });

        await tx.price.create({
          data: {
            basePrice: priceDefaults.basePrice,
            disabilityPrice: priceDefaults.disabilityPrice,
            earlyRisePrice: priceDefaults.earlyRisePrice,
            breakfastPrice: priceDefaults.breakfastPrice,
            lunchPrice: priceDefaults.lunchPrice,
            isActive: true,
            validFrom: new Date(),
            validTo: null,
            notes: null,
            weekId: week.id,
          },
        });
      }

      return tx.summerCamp.findUnique({
        where: { id: camp.id },
        include: {
          weeks: {
            orderBy: {
              number: "asc",
            },
            include: {
              prices: true,
            },
          },
        },
      });
    });

    res.status(201).json(createdCamp);
  } catch (error) {
    console.error("Error al crear campamento:", error);
    res.status(500).json({ error: "Error al crear campamento" });
  }
};

export const updateSummerCamp = async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const {
      name,
      place,
      year,
      description,
      startDate,
      endDate,
      inscriptionOpenDate,
      inscriptionCloseDate,
      formEnabled,
      isActive,
      weekDefaults,
      priceDefaults,
    } = req.validatedBody;

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id },
      include: {
        weeks: {
          orderBy: {
            number: "asc",
          },
          include: {
            signedUpWeeks: true,
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
        error: "El campamento no existe",
      });
    }

    const hasAnyInscriptions = existingCamp.weeks.some(
      (week) => week.signedUpWeeks.length > 0
    );

    const finalStartDate = startDate !== undefined ? startDate : existingCamp.startDate;
    const finalEndDate = endDate !== undefined ? endDate : existingCamp.endDate;

    const datesChanged = startDate !== undefined || endDate !== undefined;

    if (datesChanged && hasAnyInscriptions) {
      if (
        startDate !== undefined &&
        new Date(startDate).getTime() !== new Date(existingCamp.startDate).getTime()
      ) {
        return res.status(409).json({
          error:
            "No se puede modificar startDate si el campamento ya tiene inscripciones",
        });
      }

      if (
        endDate !== undefined &&
        new Date(endDate) < new Date(existingCamp.endDate)
      ) {
        return res.status(409).json({
          error:
            "No se puede acortar endDate si el campamento ya tiene inscripciones",
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.summerCamp.update({
        where: { id },
        data: {
          ...(name !== undefined && { name }),
          ...(place !== undefined && { place }),
          ...(year !== undefined && { year }),
          ...(description !== undefined && { description: description || null }),
          ...(startDate !== undefined && { startDate }),
          ...(endDate !== undefined && { endDate }),
          ...(inscriptionOpenDate !== undefined && {
            inscriptionOpenDate,
          }),
          ...(inscriptionCloseDate !== undefined && {
            inscriptionCloseDate,
          }),
          ...(formEnabled !== undefined && { formEnabled }),
          ...(isActive !== undefined && { isActive }),
          ...(weekDefaults && {
            defaultTotalPlaces: weekDefaults.totalPlaces,
            defaultTotalDisabilityPlaces: weekDefaults.totalDisabilityPlaces,
          }),
          ...(priceDefaults && {
            defaultBasePrice: priceDefaults.basePrice,
            defaultDisabilityPrice: priceDefaults.disabilityPrice,
            defaultEarlyRisePrice: priceDefaults.earlyRisePrice,
            defaultBreakfastPrice: priceDefaults.breakfastPrice,
            defaultLunchPrice: priceDefaults.lunchPrice,
          }),
        },
      });

      if (!datesChanged) {
        return tx.summerCamp.findUnique({
          where: { id },
          include: {
            weeks: {
              orderBy: { number: "asc" },
              include: { prices: true },
            },
          },
        });
      }

      const newRanges = computeWeekRanges(finalStartDate, finalEndDate);

      if (!hasAnyInscriptions) {
        const oldWeekIds = existingCamp.weeks.map((w) => w.id);

        if (oldWeekIds.length > 0) {
          await tx.price.deleteMany({
            where: {
              weekId: { in: oldWeekIds },
            },
          });

          await tx.week.deleteMany({
            where: {
              summerCampId: id,
            },
          });
        }

        const finalWeekDefaults =
          weekDefaults ?? {
            totalPlaces: existingCamp.defaultTotalPlaces,
            totalDisabilityPlaces: existingCamp.defaultTotalDisabilityPlaces,
          };

        const finalPriceDefaults =
          priceDefaults ?? {
            basePrice: existingCamp.defaultBasePrice,
            disabilityPrice: existingCamp.defaultDisabilityPrice,
            earlyRisePrice: existingCamp.defaultEarlyRisePrice,
            breakfastPrice: existingCamp.defaultBreakfastPrice,
            lunchPrice: existingCamp.defaultLunchPrice,
          };

        for (const range of newRanges) {
          const week = await tx.week.create({
            data: {
              number: range.number,
              startDate: range.startDate,
              endDate: range.endDate,
              totalPlaces: finalWeekDefaults.totalPlaces,
              availablePlaces: finalWeekDefaults.totalPlaces,
              totalDisabilityPlaces: finalWeekDefaults.totalDisabilityPlaces,
              availableDisabilityPlaces:
                finalWeekDefaults.totalDisabilityPlaces,
              active: true,
              summerCampId: id,
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
        }
      } else {
        const oldWeeks = existingCamp.weeks;
        const oldLastWeek = oldWeeks[oldWeeks.length - 1];
        const oldCampEndDate = new Date(existingCamp.endDate);
        const requestedEndDate = new Date(finalEndDate);

        if (requestedEndDate.getTime() > oldCampEndDate.getTime()) {
          let cursorDate = addDays(oldCampEndDate, 1);

          const currentLastWeekLength =
            Math.floor(
              (new Date(oldLastWeek.endDate) - new Date(oldLastWeek.startDate)) /
                MS_PER_DAY
            ) + 1;

          let remainingDaysToFillLastWeek = 7 - currentLastWeekLength;

          if (remainingDaysToFillLastWeek > 0 && cursorDate <= requestedEndDate) {
            const maxExtraDays = Math.min(
              remainingDaysToFillLastWeek,
              Math.floor((requestedEndDate - cursorDate) / MS_PER_DAY) + 1
            );

            const newLastWeekEndDate = addDays(oldLastWeek.endDate, maxExtraDays);

            await tx.week.update({
              where: { id: oldLastWeek.id },
              data: {
                endDate: newLastWeekEndDate,
              },
            });

            cursorDate = addDays(newLastWeekEndDate, 1);
          }

          const defaultWeekValues =
            weekDefaults ?? {
              totalPlaces: existingCamp.defaultTotalPlaces,
              totalDisabilityPlaces:
                existingCamp.defaultTotalDisabilityPlaces,
            };

          const defaultPriceValues =
            priceDefaults ?? {
              basePrice: existingCamp.defaultBasePrice,
              disabilityPrice: existingCamp.defaultDisabilityPrice,
              earlyRisePrice: existingCamp.defaultEarlyRisePrice,
              breakfastPrice: existingCamp.defaultBreakfastPrice,
              lunchPrice: existingCamp.defaultLunchPrice,
            };

          let newWeekNumber = oldLastWeek.number + 1;

          while (cursorDate <= requestedEndDate) {
            let newWeekEndDate = addDays(cursorDate, 6);
            if (newWeekEndDate > requestedEndDate) {
              newWeekEndDate = requestedEndDate;
            }

            const week = await tx.week.create({
              data: {
                number: newWeekNumber,
                startDate: new Date(cursorDate),
                endDate: new Date(newWeekEndDate),
                totalPlaces: defaultWeekValues.totalPlaces,
                availablePlaces: defaultWeekValues.totalPlaces,
                totalDisabilityPlaces: defaultWeekValues.totalDisabilityPlaces,
                availableDisabilityPlaces:
                  defaultWeekValues.totalDisabilityPlaces,
                active: true,
                summerCampId: id,
              },
            });

            await tx.price.create({
              data: {
                basePrice: defaultPriceValues.basePrice,
                disabilityPrice: defaultPriceValues.disabilityPrice,
                earlyRisePrice: defaultPriceValues.earlyRisePrice,
                breakfastPrice: defaultPriceValues.breakfastPrice,
                lunchPrice: defaultPriceValues.lunchPrice,
                isActive: true,
                validFrom: new Date(),
                validTo: null,
                notes: null,
                weekId: week.id,
              },
            });

            cursorDate = addDays(newWeekEndDate, 1);
            newWeekNumber += 1;
          }
        }
      }

      return tx.summerCamp.findUnique({
        where: { id },
        include: {
          weeks: {
            orderBy: { number: "asc" },
            include: { prices: true },
          },
        },
      });
    });

    res.json(result);
  } catch (error) {
    console.error("Error al actualizar campamento:", error);
    res.status(500).json({
      error: error.message || "Error al actualizar campamento",
    });
  }
};

export const deleteSummerCamp = async (req, res) => {
  try {
    const { id } = req.validatedParams;

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id },
      include: {
        importantDates: true,
        weeks: {
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

    const hasInscriptions = existingCamp.weeks.some(
      (week) => week.signedUpWeeks.length > 0
    );

    if (hasInscriptions) {
      return res.status(409).json({
        error:
          "No se puede eliminar el campamento porque alguna de sus semanas tiene inscripciones asociadas",
      });
    }

    await prisma.$transaction(async (tx) => {
      const weekIds = existingCamp.weeks.map((week) => week.id);

      if (existingCamp.importantDates.length > 0) {
        await tx.importantDate.deleteMany({
          where: { summerCampId: id },
        });
      }

      if (weekIds.length > 0) {
        await tx.price.deleteMany({
          where: {
            weekId: { in: weekIds },
          },
        });

        await tx.week.deleteMany({
          where: {
            summerCampId: id,
          },
        });
      }

      await tx.summerCamp.delete({
        where: { id },
      });
    });

    res.json({ message: "Campamento eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar campamento:", error);
    res.status(500).json({ error: "Error al eliminar campamento" });
  }
};

export const getPublicSummerCampByYear = async (req, res) => {
  try {
    const { year } = req.params;
    const parsedYear = Number(year);

    const summerCamp = await prisma.summerCamp.findUnique({
  where: {
    year: parsedYear,
  },
  include: {
    weeks: {
      where: {
        active: true,
      },
      orderBy: {
        number: "asc",
      },
      include: {
        prices: {
          where: {
            isActive: true,
          },
          orderBy: {
            createdAt: "desc",
          },
          take: 1,
        },
      },
    },
  },
});

    if (!summerCamp) {
      return res.status(404).json({
        error: "Campamento no encontrado",
      });
    }

    if (!summerCamp.isActive || !summerCamp.formEnabled) {
      return res.status(403).json({
        error: "El formulario de inscripción no está disponible actualmente",
      });
    }

    const now = new Date();

    if (
      summerCamp.inscriptionOpenDate &&
      now < new Date(summerCamp.inscriptionOpenDate)
    ) {
      return res.status(403).json({
        error: "El periodo de inscripción todavía no está abierto",
      });
    }

    if (
      summerCamp.inscriptionCloseDate &&
      now > new Date(summerCamp.inscriptionCloseDate)
    ) {
      return res.status(403).json({
        error: "El periodo de inscripción ya está cerrado",
      });
    }

    res.json(summerCamp);
  } catch (error) {
    console.error("Error al obtener campamento público:", error);
    res.status(500).json({
      error: "Error al obtener campamento público",
    });
  }
};