import express from "express";
import {
  updateSignedUpStatus,
  getSignedUpsByWeek,
  getWeekWaitlist,
  cancelExpiredPendingSignedUps,
} from "../controllers/signedUp.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {updateSignedUpStatusParamsSchema,updateSignedUpStatusBodySchema,getSignedUpsByWeekParamsSchema,getSignedUpsByWeekQuerySchema,getWeekWaitlistParamsSchema} from "../schemas/signedUp.schema.js";
const router = express.Router();

router.get("/week/:weekId",validate({ params: getSignedUpsByWeekParamsSchema, query: getSignedUpsByWeekQuerySchema}),requireAuth,requireRole("ADMIN", "SUPERADMIN"),getSignedUpsByWeek);
router.get("/week/:weekId/waitlist",requireAuth,validate({ params:getWeekWaitlistParamsSchema}),requireRole("ADMIN", "SUPERADMIN"),getWeekWaitlist);
router.post("/cancel-expired",requireAuth,requireRole("ADMIN", "SUPERADMIN"),cancelExpiredPendingSignedUps);
router.patch("/inscription/:inscriptionId/week/:weekId/status",requireAuth,validate({ params: updateSignedUpStatusParamsSchema, body:updateSignedUpStatusBodySchema }),requireRole("ADMIN", "SUPERADMIN"),updateSignedUpStatus);

export default router;