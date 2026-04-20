import express from "express";
import {
  getDashboard,
  getInscriptionsTable,
  getPendingPayments,
  getDebtors,
} from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { getDashboardParamsSchema,getInscriptionsTableQuerySchema } from "../schemas/admin.schema.js";
const router = express.Router();
router.use(requireAuth, requireRole("ADMIN", "SUPERADMIN"));

router.get("/dashboard/:summerCampId",validate({ params: getDashboardParamsSchema }), getDashboard);
router.get("/inscriptions-table",validate({ query: getInscriptionsTableQuerySchema }), getInscriptionsTable);
router.get("/pending-payments", getPendingPayments);
router.get("/debtors", getDebtors);

export default router;