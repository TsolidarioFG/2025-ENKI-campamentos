import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma.js";
import summerCampRoutes from "./routes/summerCamp.routes.js";

dotenv.config();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.json({ status: "API funcionando correctamente" });
});

app.get("/api/test-db", async (req, res) => {
  try {
    const count = await prisma.summerCamp.count();
    res.json({
      message: "Conexión con la base de datos correcta",
      summerCampCount: count,
    });
  } catch (error) {
    console.error("Error de base de datos:", error);
    res.status(500).json({ error: "Error al conectar con la base de datos" });
  }
});

app.use("/api/summercamps", summerCampRoutes);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});