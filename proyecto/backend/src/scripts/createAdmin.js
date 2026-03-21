import dotenv from "dotenv";
import prisma from "../lib/prisma.js";
import { hashPassword } from "../utils/auth.js";

dotenv.config();

const main = async () => {
  const username = "admin";
  const email = "admin@enki.com";
  const plainPassword = "admin";

  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log("Ya existe un usuario con ese email.");
    return;
  }

  const passwordHash = await hashPassword(plainPassword);

  const user = await prisma.user.create({
    data: {
      username,
      email,
      passwordHash,
      role: "SUPERADMIN",
      active: true,
    },
  });

  console.log("Admin creado correctamente:");
  console.log({
    id: user.id,
    username: user.username,
    email: user.email,
    role: user.role,
    password: plainPassword,
  });
};

main()
  .catch((error) => {
    console.error("Error creando admin:", error);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });