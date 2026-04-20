import prisma from "../lib/prisma.js";
import { hashPassword } from "../utils/auth.js";

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "asc",
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      totalUsers: users.length,
      users,
    });
  } catch (error) {
    console.error("Error al obtener usuarios:", error);
    res.status(500).json({
      error: "Error al obtener usuarios",
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const {
      username,
      email,
      password,
      role,
      active,
    } = req.validatedBody;

    const existingUsername = await prisma.user.findUnique({
      where: { username: username },
    });

    if (existingUsername) {
      return res.status(409).json({
        error: "Ya existe un usuario con ese username",
      });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email: email },
    });

    if (existingEmail) {
      return res.status(409).json({
        error: "Ya existe un usuario con ese email",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username: username,
        email: email,
        passwordHash,
        role,
        active: active ?? true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json({
      message: "Usuario creado correctamente",
      user,
    });
  } catch (error) {
    console.error("Error al crear usuario:", error);
    res.status(500).json({
      error: "Error al crear usuario",
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const { active } = req.validatedBody;

    const existingUser = await prisma.user.findUnique({
      where: { id: id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (existingUser.role === "SUPERADMIN" && active === false) {
      return res.status(400).json({
        error: "No se puede desactivar el SUPERADMIN",
      });
    }

    const updatedUser = await prisma.user.update({
      where: { id: id },
      data: { active },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        active: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json({
      message: "Estado del usuario actualizado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      error: "Error al actualizar usuario",
    });
  }
};