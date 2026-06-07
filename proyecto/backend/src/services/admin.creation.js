import prisma from "../lib/prisma.js";
import { hashPassword } from "../utils/auth.js";

export const ensureInitialAdmin = async () => {
  const username = "admin";
  const email = "admin@enki.com";
  const plainPassword = "admin";

  const existingUserByEmail = await prisma.user.findUnique({
    where: { email },
  });

  const existingUserByUsername = await prisma.user.findUnique({
    where: { username },
  });

  const existingUser = existingUserByEmail || existingUserByUsername;

  if (existingUser) {
    const updateData = {
      username,
      email,
      role: "SUPERADMIN",
      active: true,
    };

    if ("systemProtected" in existingUser) {
      updateData.systemProtected = true;
    }

    const updatedUser = await prisma.user.update({
      where: {
        id: existingUser.id,
      },
      data: updateData,
    });

    console.log("Superadmin inicial comprobado correctamente:");
    console.log({
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      active: updatedUser.active,
      systemProtected: updatedUser.systemProtected,
    });

    return updatedUser;
  }

  const passwordHash = await hashPassword(plainPassword);

  const createData = {
    username,
    email,
    passwordHash,
    role: "SUPERADMIN",
    active: true,
  };

  try {
    createData.systemProtected = true;

    const user = await prisma.user.create({
      data: createData,
    });

    console.log("Superadmin inicial creado correctamente:");
    console.log({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      active: user.active,
      systemProtected: user.systemProtected,
      password: plainPassword,
    });

    return user;
  } catch (error) {
    if (
      error.code === "P2022" ||
      error.message?.includes("systemProtected")
    ) {
      delete createData.systemProtected;

      const user = await prisma.user.create({
        data: createData,
      });

      console.log("Superadmin inicial creado correctamente:");
      console.log({
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
        password: plainPassword,
      });

      return user;
    }

    throw error;
  }
};