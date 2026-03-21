import express from "express";
import {
  updateSignedUpStatus,
  getSignedUpsByWeek,
  getWeekWaitlist,
  cancelExpiredPendingSignedUps,
} from "../controllers/signedUp.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get(
  "/week/:weekId",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  getSignedUpsByWeek
);

router.get(
  "/week/:weekId/waitlist",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  getWeekWaitlist
);

router.post(
  "/cancel-expired",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  cancelExpiredPendingSignedUps
);

router.patch(
  "/inscription/:inscriptionId/week/:weekId/status",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  updateSignedUpStatus
);

export default router;