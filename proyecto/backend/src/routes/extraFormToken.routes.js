import express from "express";
import {
  createExtraFormToken,
  getExtraFormByToken,
  updateExtraFormByToken,
} from "../controllers/extraFormToken.Controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  participantIdParamsSchema,
  extraFormTokenParamsSchema,
} from "../schemas/extraFormToken.schema.js";

const router = express.Router();

router.post(
  "/participant/:participantId",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  validate({ params: participantIdParamsSchema }),
  createExtraFormToken
);

router.get(
  "/public/:token",
  validate({ params: extraFormTokenParamsSchema }),
  getExtraFormByToken
);

router.patch(
  "/public/:token",
  validate({ params: extraFormTokenParamsSchema }),
  updateExtraFormByToken
);

export default router;