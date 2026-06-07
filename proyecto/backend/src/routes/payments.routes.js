import express from "express";
import {
  getPayments,
  getPaymentById,
  registerPayment,
  createExtraPayment,
} from "../controllers/payments.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  getPaymentsQuerySchema,
  getPaymentByIdParamsSchema,
  createExtraPaymentBodySchema,
  registerPaymentParamsSchema,
  registerPaymentBodySchema,
} from "../schemas/payment.schema.js";

const router = express.Router();

router.get(
  "/",
  requireAuth,
  validate({ query: getPaymentsQuerySchema }),
  getPayments
);

router.get(
  "/:id",
  requireAuth,
  validate({ params: getPaymentByIdParamsSchema }),
  getPaymentById
);

router.post(
  "/extra",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  validate({ body: createExtraPaymentBodySchema }),
  createExtraPayment
);

router.patch(
  "/:id/pay",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  validate({
    params: registerPaymentParamsSchema,
    body: registerPaymentBodySchema,
  }),
  registerPayment
);

export default router;