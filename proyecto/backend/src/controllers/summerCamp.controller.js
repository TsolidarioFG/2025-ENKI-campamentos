import prisma from "../lib/prisma.js";

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
      formEnabled,
      isActive,
    } = req.body;

    if (!name || !place || !year) {
      return res.status(400).json({
        error: "Los campos name, place y year son obligatorios",
      });
    }

    const newCamp = await prisma.summerCamp.create({
      data: {
        name,
        place,
        year: Number(year),
        description: description || null,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
        inscriptionOpenDate: inscriptionOpenDate ? new Date(inscriptionOpenDate) : null,
        inscriptionCloseDate: inscriptionCloseDate ? new Date(inscriptionCloseDate) : null,
        formEnabled: formEnabled ?? true,
        isActive: isActive ?? true,
      },
    });

    res.status(201).json(newCamp);
  } catch (error) {
    console.error("Error al crear campamento:", error);
    res.status(500).json({ error: "Error al crear campamento" });
  }
};