import prisma from "../lib/prisma.js";
import { hashPassword } from "../utils/auth.js";

const userSelect = {
  id: true,
  username: true,
  email: true,
  role: true,
  active: true,
  createdAt: true,
  updatedAt: true,
};

const getActiveSuperadminCount = async () => {
  return prisma.user.count({
    where: {
      role: "SUPERADMIN",
      active: true,
    },
  });
};

export const getUsers = async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      orderBy: {
        createdAt: "asc",
      },
      select: userSelect,
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
export const getOwnProfile = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Error al obtener perfil:", error);
    res.status(500).json({
      error: "Error al obtener perfil",
    });
  }
};

export const updateOwnProfile = async (req, res) => {
  try {
    const { username, email, password } = req.validatedBody;

    const currentUser = await prisma.user.findUnique({
      where: { id: req.user.id },
    });

    if (!currentUser) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (username !== undefined) {
      const duplicatedUsername = await prisma.user.findFirst({
        where: {
          username,
          id: {
            not: req.user.id,
          },
        },
      });

      if (duplicatedUsername) {
        return res.status(409).json({
          error: "Ya existe otro usuario con ese username",
        });
      }
    }

    if (email !== undefined) {
      const duplicatedEmail = await prisma.user.findFirst({
        where: {
          email,
          id: {
            not: req.user.id,
          },
        },
      });

      if (duplicatedEmail) {
        return res.status(409).json({
          error: "Ya existe otro usuario con ese email",
        });
      }
    }

    const data = {
      ...(username !== undefined && { username }),
      ...(email !== undefined && { email }),
    };

    if (password !== undefined && password.trim() !== "") {
      data.passwordHash = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data,
      select: userSelect,
    });

    res.json({
      message: "Perfil actualizado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar perfil:", error);
    res.status(500).json({
      error: "Error al actualizar perfil",
    });
  }
};

export const getUserById = async (req, res) => {
  try {
    const { id } = req.validatedParams;

    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    res.json(user);
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({
      error: "Error al obtener usuario",
    });
  }
};

export const createUser = async (req, res) => {
  try {
    const { username, email, password, role, active } = req.validatedBody;

    const existingUsername = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUsername) {
      return res.status(409).json({
        error: "Ya existe un usuario con ese username",
      });
    }

    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingEmail) {
      return res.status(409).json({
        error: "Ya existe un usuario con ese email",
      });
    }

    const passwordHash = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        username,
        email,
        passwordHash,
        role,
        active: active ?? true,
      },
      select: userSelect,
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

export const updateUser = async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const { username, email, password, role, active } = req.validatedBody;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (username !== undefined) {
      const duplicatedUsername = await prisma.user.findFirst({
        where: {
          username,
          id: {
            not: id,
          },
        },
      });

      if (duplicatedUsername) {
        return res.status(409).json({
          error: "Ya existe otro usuario con ese username",
        });
      }
    }

    if (email !== undefined) {
      const duplicatedEmail = await prisma.user.findFirst({
        where: {
          email,
          id: {
            not: id,
          },
        },
      });

      if (duplicatedEmail) {
        return res.status(409).json({
          error: "Ya existe otro usuario con ese email",
        });
      }
    }

    const isTurningOffActiveSuperadmin =
      existingUser.role === "SUPERADMIN" && active === false;

    const isChangingSuperadminRole =
      existingUser.role === "SUPERADMIN" &&
      role !== undefined &&
      role !== "SUPERADMIN";

    if (isTurningOffActiveSuperadmin || isChangingSuperadminRole) {
      const activeSuperadminCount = await getActiveSuperadminCount();

      if (activeSuperadminCount <= 1) {
        return res.status(409).json({
          error:
            "No se puede dejar el sistema sin ningún SUPERADMIN activo",
        });
      }
    }

    const data = {
      ...(username !== undefined && { username }),
      ...(email !== undefined && { email }),
      ...(role !== undefined && { role }),
      ...(active !== undefined && { active }),
    };

    if (password !== undefined && password.trim() !== "") {
      data.passwordHash = await hashPassword(password);
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data,
      select: userSelect,
    });

    res.json({
      message: "Usuario actualizado correctamente",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Error al actualizar usuario:", error);
    res.status(500).json({
      error: "Error al actualizar usuario",
    });
  }
};

export const updateUserStatus = async (req, res) => {
  try {
    const { id } = req.validatedParams;
    const { active } = req.validatedBody;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (existingUser.role === "SUPERADMIN" && active === false) {
      const activeSuperadminCount = await getActiveSuperadminCount();

      if (activeSuperadminCount <= 1) {
        return res.status(409).json({
          error:
            "No se puede dejar el sistema sin ningún SUPERADMIN activo",
        });
      }
    }

    const updatedUser = await prisma.user.update({
      where: { id },
      data: { active },
      select: userSelect,
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

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.validatedParams;

    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      return res.status(404).json({
        error: "Usuario no encontrado",
      });
    }

    if (existingUser.role === "SUPERADMIN") {
      const activeSuperadminCount = await getActiveSuperadminCount();

      if (existingUser.active && activeSuperadminCount <= 1) {
        return res.status(409).json({
          error:
            "No se puede dejar el sistema sin ningún SUPERADMIN activo",
        });
      }
    }

    const disabledUser = await prisma.user.update({
      where: { id },
      data: {
        active: false,
      },
      select: userSelect,
    });

    res.json({
      message: "Usuario desactivado correctamente",
      user: disabledUser,
    });
  } catch (error) {
    console.error("Error al desactivar usuario:", error);
    res.status(500).json({
      error: "Error al desactivar usuario",
    });
  }
};