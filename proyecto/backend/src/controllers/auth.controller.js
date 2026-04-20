import prisma from "../lib/prisma.js";
import { comparePassword, generateToken } from "../utils/auth.js";


export const login = async (req, res) => {
  try {
    const { email, password } = req.validatedBody;
    const user = await prisma.user.findUnique({
      where: { email: email.trim() },
    });

    if (!user) {
      return res.status(401).json({
        error: "Credenciales incorrectas",
      });
    }

    if (!user.active) {
      return res.status(403).json({
        error: "El usuario está inactivo",
      });
    }

    const passwordIsValid = await comparePassword(password, user.passwordHash);

    if (!passwordIsValid) {
      return res.status(401).json({
        error: "Credenciales incorrectas",
      });
    }

    const token = generateToken(user);

    res.json({
      message: "Login correcto",
      token,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        active: user.active,
      },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({
      error: "Error en login",
    });
  }
};

export const me = async (req, res) => {
  try {
    res.json({
      user: {
        id: req.user.id,
        username: req.user.username,
        email: req.user.email,
        role: req.user.role,
        active: req.user.active,
      },
    });
  } catch (error) {
    console.error("Error obteniendo usuario autenticado:", error);
    res.status(500).json({
      error: "Error obteniendo usuario autenticado",
    });
  }
};