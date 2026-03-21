import prisma from "../lib/prisma.js";

export const getAppSettings = async (req, res) => {
  try {
    let settings = await prisma.appSettings.findUnique({
      where: { id: 1 },
    });

    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          id: 1,
          pendingReservationHours: 48,
        },
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("Error al obtener configuración global:", error);
    res.status(500).json({
      error: "Error al obtener configuración global",
    });
  }
};

export const updateAppSettings = async (req, res) => {
  try {
    if (!req.body) {
      return res.status(400).json({
        error: "La petición no contiene body en formato JSON",
      });
    }

    const { pendingReservationHours } = req.body;

    if (
      pendingReservationHours === undefined ||
      !Number.isInteger(Number(pendingReservationHours)) ||
      Number(pendingReservationHours) <= 0
    ) {
      return res.status(400).json({
        error: "pendingReservationHours debe ser un número entero mayor que 0",
      });
    }

    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: {
        pendingReservationHours: Number(pendingReservationHours),
      },
      create: {
        id: 1,
        pendingReservationHours: Number(pendingReservationHours),
      },
    });

    res.json({
      message: "Configuración global actualizada correctamente",
      settings,
    });
  } catch (error) {
    console.error("Error al actualizar configuración global:", error);
    res.status(500).json({
      error: "Error al actualizar configuración global",
    });
  }
};