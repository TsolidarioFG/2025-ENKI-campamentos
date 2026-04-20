import express from "express";
import {
  getPayments,
  getPaymentById,
  registerPayment,
  createExtraPayment,
} from "../controllers/payments.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { getPaymentsQuerySchema,getPaymentByIdParamsSchema,createExtraPaymentBodySchema,registerPaymentParamsSchema,registerPaymentBodySchema } from "../schemas/payment.schema.js";
const router = express.Router();

router.get("/", validate({ body: getPaymentsQuerySchema }),requireAuth, requireRole("ADMIN", "SUPERADMIN"), getPayments);
router.get("/:id", validate({ params: getPaymentByIdParamsSchema }),requireAuth, requireRole("ADMIN", "SUPERADMIN"), getPaymentById);
router.post("/extra", validate({ body:  createExtraPaymentBodySchema}),requireAuth, requireRole("ADMIN", "SUPERADMIN"), createExtraPayment);
router.patch("/:id/pay", validate({ body: registerPaymentBodySchema, params:registerPaymentParamsSchema}),requireAuth, requireRole("ADMIN", "SUPERADMIN"), registerPayment);

export default router;