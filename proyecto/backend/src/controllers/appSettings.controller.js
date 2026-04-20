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
    const { pendingReservationHours } = req.validatedBody;

    const settings = await prisma.appSettings.upsert({
      where: { id: 1 },
      update: {
        pendingReservationHours,
      },
      create: {
        id: 1,
        pendingReservationHours,
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