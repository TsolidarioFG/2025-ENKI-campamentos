import express from "express";
import {
  getAppSettings,
  updateAppSettings,
} from "../controllers/appSettings.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { updateAppSettingsBodySchema } from "../schemas/appSettings.schema.js";
const router = express.Router();

router.get("/", requireAuth, requireRole("ADMIN", "SUPERADMIN"), getAppSettings);
router.patch("/", validate({ body: updateAppSettingsBodySchema }), updateAppSettings);

export default router;