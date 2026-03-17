import prisma from "../lib/prisma.js";
//check that only allowed updates are possible, check values, check if its necessary to sepaarte ttwo funcions to get camps, check if all values to  create camp are theer an needed
const parsePositiveInt = (value) => {
  if (value === undefined || value === null || value === "") return null;

  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
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

export const getSummerCamps = async (req, res) => {
  try {
    const camps = await prisma.summerCamp.findMany({
      orderBy: {
        year: "desc",
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
    } = req.body;

    if (!name || !place || year === undefined) {
      return res.status(400).json({
        error: "Los campos name, place y year son obligatorios",
      });
    }

    if (typeof name !== "string" || !name.trim()) {
      return res.status(400).json({
        error: "name debe ser un texto no vacío",
      });
    }

    if (typeof place !== "string" || !place.trim()) {
      return res.status(400).json({
        error: "place debe ser un texto no vacío",
      });
    }

    const parsedYear = parsePositiveInt(year);
    if (parsedYear === null) {
      return res.status(400).json({
        error: "year debe ser un número entero mayor que 0",
      });
    }

    const parsedFormEnabled =
      formEnabled !== undefined ? parseBooleanStrict(formEnabled) : true;

    if (formEnabled !== undefined && parsedFormEnabled === null) {
      return res.status(400).json({
        error: "formEnabled debe ser booleano",
      });
    }

    const parsedIsActive =
      isActive !== undefined ? parseBooleanStrict(isActive) : true;

    if (isActive !== undefined && parsedIsActive === null) {
      return res.status(400).json({
        error: "isActive debe ser booleano",
      });
    }

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

    if (parsedStartDate && parsedEndDate && parsedEndDate <= parsedStartDate) {
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
      parsedStartDate &&
      parsedInscriptionCloseDate > parsedStartDate
    ) {
      return res.status(400).json({
        error: "inscriptionCloseDate no puede ser posterior al inicio del campamento",
      });
    }

    if (
      parsedInscriptionOpenDate &&
      parsedEndDate &&
      parsedInscriptionOpenDate > parsedEndDate
    ) {
      return res.status(400).json({
        error: "inscriptionOpenDate no puede ser posterior al fin del campamento",
      });
    }

    if (
      parsedInscriptionCloseDate &&
      parsedEndDate &&
      parsedInscriptionCloseDate > parsedEndDate
    ) {
      return res.status(400).json({
        error: "inscriptionCloseDate no puede ser posterior al fin del campamento",
      });
    }

    const newCamp = await prisma.summerCamp.create({
      data: {
        name: name.trim(),
        place: place.trim(),
        year: parsedYear,
        description: description || null,
        startDate: parsedStartDate ?? null,
        endDate: parsedEndDate ?? null,
        inscriptionOpenDate: parsedInscriptionOpenDate ?? null,
        inscriptionCloseDate: parsedInscriptionCloseDate ?? null,
        formEnabled: parsedFormEnabled,
        isActive: parsedIsActive,
      },
    });

    res.status(201).json(newCamp);
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
        error: "No se pueden modificar los campos id ni createdAt",
      });
    }

    const existingCamp = await prisma.summerCamp.findUnique({
      where: { id: parsedId },
    });

    if (!existingCamp) {
      return res.status(404).json({
        error: "El campamento no existe",
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
    } = req.body;

    if (name !== undefined) {
      if (typeof name !== "string" || !name.trim()) {
        return res.status(400).json({
          error: "name debe ser un texto no vacío",
        });
      }
    }

    if (place !== undefined) {
      if (typeof place !== "string" || !place.trim()) {
        return res.status(400).json({
          error: "place debe ser un texto no vacío",
        });
      }
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

    if (finalStartDate && finalEndDate && finalEndDate <= finalStartDate) {
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
      finalStartDate &&
      finalInscriptionCloseDate > finalStartDate
    ) {
      return res.status(400).json({
        error: "inscriptionCloseDate no puede ser posterior al inicio del campamento",
      });
    }

    if (
      finalInscriptionOpenDate &&
      finalEndDate &&
      finalInscriptionOpenDate > finalEndDate
    ) {
      return res.status(400).json({
        error: "inscriptionOpenDate no puede ser posterior al fin del campamento",
      });
    }

    if (
      finalInscriptionCloseDate &&
      finalEndDate &&
      finalInscriptionCloseDate > finalEndDate
    ) {
      return res.status(400).json({
        error: "inscriptionCloseDate no puede ser posterior al fin del campamento",
      });
    }

    const updatedCamp = await prisma.summerCamp.update({
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
      },
    });

    res.json(updatedCamp);
  } catch (error) {
    console.error("Error al actualizar campamento:", error);
    res.status(500).json({ error: "Error al actualizar campamento" });
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
            prices: true,
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

    const weekIds = existingCamp.weeks.map((week) => week.id);

    if (existingCamp.importantDates.length > 0) {
      await prisma.importantDate.deleteMany({
        where: { summerCampId: parsedId },
      });
    }

    if (weekIds.length > 0) {
      await prisma.price.deleteMany({
        where: {
          weekId: { in: weekIds },
        },
      });

      await prisma.week.deleteMany({
        where: {
          summerCampId: parsedId,
        },
      });
    }

    await prisma.summerCamp.delete({
      where: { id: parsedId },
    });

    res.json({ message: "Campamento eliminado correctamente" });
  } catch (error) {
    console.error("Error al eliminar campamento:", error);
    res.status(500).json({ error: "Error al eliminar campamento" });
  }
};