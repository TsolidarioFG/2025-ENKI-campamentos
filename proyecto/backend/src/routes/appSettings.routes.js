import express from "express";
import {
  getAppSettings,
  updateAppSettings,
} from "../controllers/appSettings.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("ADMIN", "SUPERADMIN"), getAppSettings);
router.patch("/", requireAuth, requireRole("SUPERADMIN"), updateAppSettings);

export default router;