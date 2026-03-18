import prisma from "../lib/prisma.js";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

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

const parseNonNegativeNumber = (value) => {
  if (value === undefined || value === null || value === "") return null;
  const parsed = Number(value);
  if (Number.isNaN(parsed) || parsed < 0) return null;
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
  if (Number.isNaN(parsed.getTime())) return "INVALID_DATE";
  return parsed;
};

const startOfDay = (date) => {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
};

const endOfDay = (date) => {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
};

const addDays = (date, days) => {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const diffDaysInclusive = (startDate, endDate) => {
  const start = startOfDay(startDate);
  const end = startOfDay(endDate);
  return Math.floor((end - start) / MS_PER_DAY) + 1;
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

const validatePriceDefaults = (priceDefaults) => {
  if (!priceDefaults || typeof priceDefaults !== "object") {
    return "priceDefaults es obligatorio";
  }

  const parsed = {
    basePrice: parseNonNegativeNumber(priceDefaults.basePrice),
    disabilityPrice: parseNonNegativeNumber(priceDefaults.disabilityPrice),
    earlyRisePrice: parseNonNegativeNumber(priceDefaults.earlyRisePrice),
    breakfastPrice: parseNonNegativeNumber(priceDefaults.breakfastPrice),
    lunchPrice: parseNonNegativeNumber(priceDefaults.lunchPrice),
  };

  if (parsed.basePrice === null) return "basePrice debe ser un número mayor o igual que 0";
  if (parsed.disabilityPrice === null) return "disabilityPrice debe ser un número mayor o igual que 0";
  if (parsed.earlyRisePrice === null) return "earlyRisePrice debe ser un número mayor o igual que 0";
  if (parsed.breakfastPrice === null) return "breakfastPrice debe ser un número mayor o igual que 0";
  if (parsed.lunchPrice === null) return "lunchPrice debe ser un número mayor o igual que 0";

  return parsed;
};

const validateWeekDefaults = (weekDefaults) => {
  if (!weekDefaults || typeof weekDefaults !== "object") {
    return "weekDefaults es obligatorio";
  }

  const parsed = {
    totalPlaces: parseNonNegativeInt(weekDefaults.totalPlaces),
    totalDisabilityPlaces: parseNonNegativeInt(weekDefaults.totalDisabilityPlaces),
  };

  if (parsed.totalPlaces === null) {
    return "totalPlaces debe ser un número entero mayor o igual que 0";
  }

  if (parsed.totalDisabilityPlaces === null) {
    return "totalDisabilityPlaces debe ser un número entero mayor o igual que 0";
  }

  return parsed;
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
    const { name, year } = req.query;

    const where = {};

    if (name) {
      where.name = {
        contains: name,
        mode: "insensitive",
      };
    }

    if (year !== undefined) {
      const parsedYear = parsePositiveInt(year);
      if (parsedYear === null) {
        return res.status(400).json({
          error: "year debe ser un número entero mayor que 0",
        });
      }
      where.year = parsedYear;
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
    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

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
    } = req.body;

    if (
      !name ||
      !place ||
      year === undefined ||
      startDate === undefined ||
      endDate === undefined ||
      weekDefaults === undefined ||
      priceDefaults === undefined
    ) {
      return res.status(400).json({
        error:
          "name, place, year, startDate, endDate, weekDefaults y priceDefaults son obligatorios",
      });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({ error: "name debe ser un texto no vacío" });
    }

    if (typeof place !== "string" || !place.trim()) {
      return res.status(400).json({ error: "place debe ser un texto no vacío" });
    }

    const parsedYear = parsePositiveInt(year);
    if (parsedYear === null) {
      return res.status(400).json({
        error: "year debe ser un número entero mayor que 0",
      });
    }

    const parsedStartDate = parseDateOrNull(startDate);
    const parsedEndDate = parseDateOrNull(endDate);
    const parsedInscriptionOpenDate = parseDateOrNull(inscriptionOpenDate);
    const parsedInscriptionCloseDate = parseDateOrNull(inscriptionCloseDate);

    if (parsedStartDate === "INVALID_DATE") {
      return res.status(400).json({ error: "startDate no es una fecha válida" });
    }

    if (parsedEndDate === "INVALID_DATE") {
      return res.status(400).json({ error: "endDate no es una fecha válida" });
    }

    if (parsedInscriptionOpenDate === "INVALID_DATE") {
      return res.status(400).json({
        error: "inscriptionOpenDate no es una fecha válida",
      });
    }

    if (parsedInscriptionCloseDate === "INVALID_DATE") {
      return res.status(400).json({
        error: "inscriptionCloseDate no es una fecha válida",
      });
    }

    if (!parsedStartDate || !parsedEndDate) {
      return res.status(400).json({
        error: "startDate y endDate no pueden ser nulos",
      });
    }

    if (parsedEndDate <= parsedStartDate) {
      return res.status(400).json({
        error: "endDate debe ser posterior a startDate",
      });
    }

    if (
      parsedInscriptionOpenDate &&
      parsedInscriptionCloseDate &&
      parsedInscriptionCloseDate <= parsedInscriptionOpenDate
    ) {
      return res.status(400).json({
        error: "inscriptionCloseDate debe ser posterior a inscriptionOpenDate",
      });
    }

    if (
      parsedInscriptionCloseDate &&
      parsedInscriptionCloseDate > parsedStartDate
    ) {
      return res.status(400).json({
        error: "inscriptionCloseDate no puede ser posterior al inicio del campamento",
      });
    }

    const validatedWeekDefaults = validateWeekDefaults(weekDefaults);
    if (typeof validatedWeekDefaults === "string") {
      return res.status(400).json({ error: validatedWeekDefaults });
    }

    const validatedPriceDefaults = validatePriceDefaults(priceDefaults);
    if (typeof validatedPriceDefaults === "string") {
      return res.status(400).json({ error: validatedPriceDefaults });
    }

    const parsedFormEnabled =
      formEnabled !== undefined ? parseBooleanStrict(formEnabled) : true;
    if (formEnabled !== undefined && parsedFormEnabled === null) {
      return res.status(400).json({ error: "formEnabled debe ser booleano" });
    }

    const parsedIsActive =
      isActive !== undefined ? parseBooleanStrict(isActive) : true;
    if (isActive !== undefined && parsedIsActive === null) {
      return res.status(400).json({ error: "isActive debe ser booleano" });
    }

    const weekRanges = computeWeekRanges(parsedStartDate, parsedEndDate);

    if (weekRanges.length === 0) {
      return res.status(400).json({
        error: "El campamento debe generar al menos una semana",
      });
    }

    const createdCamp = await prisma.$transaction(async (tx) => {
     const camp = await tx.summerCamp.create({
        data: {
          name: name.trim(),
          place: place.trim(),
          year: parsedYear,
          description: description || null,
          startDate: parsedStartDate,
          endDate: parsedEndDate,
          inscriptionOpenDate: parsedInscriptionOpenDate ?? null,
          inscriptionCloseDate: parsedInscriptionCloseDate ?? null,
          formEnabled: parsedFormEnabled,
          isActive: parsedIsActive,

          defaultTotalPlaces: validatedWeekDefaults.totalPlaces,
          defaultTotalDisabilityPlaces: validatedWeekDefaults.totalDisabilityPlaces,
          defaultBasePrice: validatedPriceDefaults.basePrice,
          defaultDisabilityPrice: validatedPriceDefaults.disabilityPrice,
          defaultEarlyRisePrice: validatedPriceDefaults.earlyRisePrice,
          defaultBreakfastPrice: validatedPriceDefaults.breakfastPrice,
          defaultLunchPrice: validatedPriceDefaults.lunchPrice,
        },
      });

      for (const weekRange of weekRanges) {
        const week = await tx.week.create({
          data: {
            number: weekRange.number,
            startDate: weekRange.startDate,
            endDate: weekRange.endDate,
            totalPlaces: validatedWeekDefaults.totalPlaces,
            availablePlaces: validatedWeekDefaults.totalPlaces,
            totalDisabilityPlaces: validatedWeekDefaults.totalDisabilityPlaces,
            availableDisabilityPlaces:
              validatedWeekDefaults.totalDisabilityPlaces,
            active: true,
            summerCampId: camp.id,
          },
        });

        await tx.price.create({
          data: {
            basePrice: validatedPriceDefaults.basePrice,
            disabilityPrice: validatedPriceDefaults.disabilityPrice,
            earlyRisePrice: validatedPriceDefaults.earlyRisePrice,
            breakfastPrice: validatedPriceDefaults.breakfastPrice,
            lunchPrice: validatedPriceDefaults.lunchPrice,
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
    const { id } = req.params;
    const parsedId = parsePositiveInt(id);

    if (parsedId === null) {
      return res.status(400).json({
        error: "id debe ser un número entero mayor que 0",
      });
    }

    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    if (req.body.id !== undefined || req.body.createdAt !== undefined) {
      return res.status(400).json({
        error: "No se pueden modificar id ni createdAt",
      });
    }

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id: parsedId },
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
    } = req.body;

    const parsedStartDate = parseDateOrNull(startDate);
    const parsedEndDate = parseDateOrNull(endDate);
    const parsedInscriptionOpenDate = parseDateOrNull(inscriptionOpenDate);
    const parsedInscriptionCloseDate = parseDateOrNull(inscriptionCloseDate);

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

    if (parsedInscriptionOpenDate === "INVALID_DATE") {
      return res.status(400).json({
        error: "inscriptionOpenDate no es una fecha válida",
      });
    }

    if (parsedInscriptionCloseDate === "INVALID_DATE") {
      return res.status(400).json({
        error: "inscriptionCloseDate no es una fecha válida",
      });
    }

    const finalStartDate =
      parsedStartDate !== undefined ? parsedStartDate : existingCamp.startDate;
    const finalEndDate =
      parsedEndDate !== undefined ? parsedEndDate : existingCamp.endDate;
    const finalInscriptionOpenDate =
      parsedInscriptionOpenDate !== undefined
        ? parsedInscriptionOpenDate
        : existingCamp.inscriptionOpenDate;
    const finalInscriptionCloseDate =
      parsedInscriptionCloseDate !== undefined
        ? parsedInscriptionCloseDate
        : existingCamp.inscriptionCloseDate;

    if (!finalStartDate || !finalEndDate) {
      return res.status(400).json({
        error: "El campamento debe tener startDate y endDate",
      });
    }

    if (finalEndDate <= finalStartDate) {
      return res.status(400).json({
        error: "endDate debe ser posterior a startDate",
      });
    }

    if (
      finalInscriptionOpenDate &&
      finalInscriptionCloseDate &&
      finalInscriptionCloseDate <= finalInscriptionOpenDate
    ) {
      return res.status(400).json({
        error: "inscriptionCloseDate debe ser posterior a inscriptionOpenDate",
      });
    }

    if (
      finalInscriptionCloseDate &&
      finalInscriptionCloseDate > finalStartDate
    ) {
      return res.status(400).json({
        error: "inscriptionCloseDate no puede ser posterior al inicio del campamento",
      });
    }

    if (name !== undefined && (typeof name !== "string" || !name.trim())) {
      return res.status(400).json({
        error: "name debe ser un texto no vacío",
      });
    }

    if (place !== undefined && (typeof place !== "string" || !place.trim())) {
      return res.status(400).json({
        error: "place debe ser un texto no vacío",
      });
    }

    let parsedYear = existingCamp.year;
    if (year !== undefined) {
      parsedYear = parsePositiveInt(year);
      if (parsedYear === null) {
        return res.status(400).json({
          error: "year debe ser un número entero mayor que 0",
        });
      }
    }

    let parsedFormEnabled;
    if (formEnabled !== undefined) {
      parsedFormEnabled = parseBooleanStrict(formEnabled);
      if (parsedFormEnabled === null) {
        return res.status(400).json({
          error: "formEnabled debe ser booleano",
        });
      }
    }

    let parsedIsActive;
    if (isActive !== undefined) {
      parsedIsActive = parseBooleanStrict(isActive);
      if (parsedIsActive === null) {
        return res.status(400).json({
          error: "isActive debe ser booleano",
        });
      }
    }

    let validatedWeekDefaults;
    if (weekDefaults !== undefined) {
      validatedWeekDefaults = validateWeekDefaults(weekDefaults);
      if (typeof validatedWeekDefaults === "string") {
        return res.status(400).json({ error: validatedWeekDefaults });
      }
    }

    let validatedPriceDefaults;
    if (priceDefaults !== undefined) {
      validatedPriceDefaults = validatePriceDefaults(priceDefaults);
      if (typeof validatedPriceDefaults === "string") {
        return res.status(400).json({ error: validatedPriceDefaults });
      }
    }

    const datesChanged =
      startDate !== undefined || endDate !== undefined;

    if (datesChanged && hasAnyInscriptions) {
      if (
        parsedStartDate !== undefined &&
        parsedStartDate.getTime() !== new Date(existingCamp.startDate).getTime()
      ) {
        return res.status(409).json({
          error:
            "No se puede modificar startDate si el campamento ya tiene inscripciones",
        });
      }

      if (
        parsedEndDate !== undefined &&
        parsedEndDate < new Date(existingCamp.endDate)
      ) {
        return res.status(409).json({
          error:
            "No se puede acortar endDate si el campamento ya tiene inscripciones",
        });
      }
    }

    const result = await prisma.$transaction(async (tx) => {
      await tx.summerCamp.update({
        where: { id: parsedId },
        data: {
          ...(name !== undefined && { name: name.trim() }),
          ...(place !== undefined && { place: place.trim() }),
          ...(year !== undefined && { year: parsedYear }),
          ...(description !== undefined && { description: description || null }),
          ...(startDate !== undefined && { startDate: parsedStartDate }),
          ...(endDate !== undefined && { endDate: parsedEndDate }),
          ...(inscriptionOpenDate !== undefined && {
            inscriptionOpenDate: parsedInscriptionOpenDate,
          }),
          ...(inscriptionCloseDate !== undefined && {
            inscriptionCloseDate: parsedInscriptionCloseDate,
          }),
          ...(formEnabled !== undefined && { formEnabled: parsedFormEnabled }),
          ...(isActive !== undefined && { isActive: parsedIsActive }),

          ...(validatedWeekDefaults && {
            defaultTotalPlaces: validatedWeekDefaults.totalPlaces,
            defaultTotalDisabilityPlaces:
              validatedWeekDefaults.totalDisabilityPlaces,
          }),

          ...(validatedPriceDefaults && {
            defaultBasePrice: validatedPriceDefaults.basePrice,
            defaultDisabilityPrice: validatedPriceDefaults.disabilityPrice,
            defaultEarlyRisePrice: validatedPriceDefaults.earlyRisePrice,
            defaultBreakfastPrice: validatedPriceDefaults.breakfastPrice,
            defaultLunchPrice: validatedPriceDefaults.lunchPrice,
          }),
        },
      });

      if (!datesChanged) {
        return tx.summerCamp.findUnique({
          where: { id: parsedId },
          include: {
            weeks: {
              orderBy: { number: "asc" },
              include: { prices: true },
            },
          },
        });
      }

      const newRanges = computeWeekRanges(finalStartDate, finalEndDate);

      // CASO 1: no hay inscripciones -> regenerar todo
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
              summerCampId: parsedId,
            },
          });
        }

        const finalWeekDefaults =
          validatedWeekDefaults ?? {
            totalPlaces: existingCamp.defaultTotalPlaces,
            totalDisabilityPlaces:
              existingCamp.defaultTotalDisabilityPlaces,
          };

        const finalPriceDefaults =
          validatedPriceDefaults ?? {
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
              summerCampId: parsedId,
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
        // CASO 2: sí hay inscripciones -> solo ampliar por el final
        const oldWeeks = existingCamp.weeks;
        const oldLastWeek = oldWeeks[oldWeeks.length - 1];
        const oldCampEndDate = new Date(existingCamp.endDate);
        const requestedEndDate = new Date(finalEndDate);

        if (requestedEndDate.getTime() > oldCampEndDate.getTime()) {
          let cursorDate = addDays(oldCampEndDate, 1);

          const currentLastWeekLength =
            Math.floor(
              (new Date(oldLastWeek.endDate) - new Date(oldLastWeek.startDate)) /
                (24 * 60 * 60 * 1000)
            ) + 1;

          let remainingDaysToFillLastWeek = 7 - currentLastWeekLength;

          if (remainingDaysToFillLastWeek > 0 && cursorDate <= requestedEndDate) {
            const maxExtraDays = Math.min(
              remainingDaysToFillLastWeek,
              Math.floor(
                (requestedEndDate - cursorDate) / (24 * 60 * 60 * 1000)
              ) + 1
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
            validatedWeekDefaults ?? {
              totalPlaces: existingCamp.defaultTotalPlaces,
              totalDisabilityPlaces:
                existingCamp.defaultTotalDisabilityPlaces,
            };

          const defaultPriceValues =
            validatedPriceDefaults ?? {
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
                summerCampId: parsedId,
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
        where: { id: parsedId },
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
    const { id } = req.params;
    const parsedId = parsePositiveInt(id);

    if (parsedId === null) {
      return res.status(400).json({
        error: "id debe ser un número entero mayor que 0",
      });
    }

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id: parsedId },
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
          where: { summerCampId: parsedId },
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
            summerCampId: parsedId,
          },
        });
      }

      await tx.summerCamp.delete({
        where: { id: parsedId },
      });
    });

    res.json({ message: "Campamento eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar campamento:", error);
    res.status(500).json({ error: "Error al eliminar campamento" });
  }
};