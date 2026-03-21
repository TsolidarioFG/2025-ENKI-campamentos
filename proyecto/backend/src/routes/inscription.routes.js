import express from "express";
import {
  getPayments,
  getPaymentById,
  registerPayment,
  createExtraPayment,
} from "../controllers/payments.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.get("/", requireAuth, requireRole("ADMIN", "SUPERADMIN"), getPayments);
router.get("/:id", requireAuth, requireRole("ADMIN", "SUPERADMIN"), getPaymentById);
router.post("/extra", requireAuth, requireRole("ADMIN", "SUPERADMIN"), createExtraPayment);
router.patch("/:id/pay", requireAuth, requireRole("ADMIN", "SUPERADMIN"), registerPayment);

export default router;