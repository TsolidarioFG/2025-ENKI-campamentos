import express from "express";
import {
  getDashboard,
  getInscriptionsTable,
  getPendingPayments,
  getDebtors,
} from "../controllers/admin.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();
router.use(requireAuth, requireRole("ADMIN", "SUPERADMIN"));

router.get("/dashboard/:summerCampId", getDashboard);
router.get("/inscriptions-table", getInscriptionsTable);
router.get("/pending-payments", getPendingPayments);
router.get("/debtors", getDebtors);

export default router;