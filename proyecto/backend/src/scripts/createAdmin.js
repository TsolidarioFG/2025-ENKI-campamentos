import dotenv from "dotenv";
import prisma from "../lib/prisma.js";
import { ensureInitialAdmin } from "../services/admin.creation.js";

dotenv.config();

const main = async () => {
  await ensureInitialAdmin();

  const settings = await prisma.appSettings.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      pendingReservationHours: 48,
    },
  });

  console.log("Ajustes generales comprobados correctamente:");
  console.log({
    id: settings.id,
    pendingReservationHours: settings.pendingReservationHours,
  });
};

main()
  .catch((error) => {
    console.error("Error creando admin:", error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });