import express from "express";
import {
  getWeeks,
  createWeek,
  updateWeek,
  deleteWeek,
} from "../controllers/week.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { getWeeksQuerySchema,createWeekBodySchema,updateWeekParamsSchema,updateWeekBodySchema,deleteWeekParamsSchema } from "../schemas/week.schema.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
const router = express.Router();

router.get("/",validate({ query: getWeeksQuerySchema }), getWeeks);

router.post("/",requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),validate({ body: createWeekBodySchema }), createWeek);
router.patch("/summercamp/:summerCampId/week/:number",requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),validate({ params: updateWeekParamsSchema, body: updateWeekBodySchema, }), updateWeek);
router.delete("/summercamp/:summerCampId/week/:number",requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),validate({ params: deleteWeekParamsSchema  }), deleteWeek);

export default router;