import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import prisma from "./lib/prisma.js";

import summerCampRoutes from "./routes/summerCamp.routes.js";
import weekRoutes from "./routes/week.routes.js";
import priceRoutes from "./routes/price.routes.js";
import inscriptionRoutes from "./routes/inscription.routes.js";
import signedUpRoutes from "./routes/signedUp.routes.js";
import paymentRoutes from "./routes/payments.routes.js";
import appSettingsRoutes from "./routes/appSettings.routes.js";
import adminRoutes from "./routes/admin.routes.js";
import authRoutes from "./routes/auth.routes.js";
import userRoutes from "./routes/user.routes.js";
import discountRoutes from "./routes/discount.routes.js";
import extraFormRoutes from "./routes/extraform.routes.js";
import extraFormTokenRoutes from "./routes/extraFormToken.routes.js";

import { startCronJobs } from "./services/cron.service.js";
import { createDefaultDiscounts } from "./services/discount.creation.js";
import { ensureInitialAdmin } from "./services/admin.creation.js";

dotenv.config();

const app = express();

app.use(cors({origin: process.env.CORS_ORIGIN || "http://localhost:5173"}));
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
app.use("/api/weeks", weekRoutes);
app.use("/api/prices", priceRoutes);
app.use("/api/inscriptions", inscriptionRoutes);


app.use("/api/signedup", signedUpRoutes);

app.use("/api/payments", paymentRoutes);
app.use("/api/settings", appSettingsRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/discounts", discountRoutes);
app.use("/api/extraForm", extraFormRoutes);
app.use("/api/extraform-tokens", extraFormTokenRoutes);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await ensureInitialAdmin();
    await createDefaultDiscounts();

    await prisma.appSettings.upsert({
      where: { id: 1 },
      update: {},
      create: {
        id: 1,
        pendingReservationHours: 48,
      },
    });

    console.log("Ajustes generales comprobados correctamente");

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`Servidor corriendo en puerto: ${PORT}`);
      startCronJobs();
    });
  } catch (error) {
    
    console.error("Error al iniciar la aplicación:", error);
    process.exit(1);
  }
};

startServer();