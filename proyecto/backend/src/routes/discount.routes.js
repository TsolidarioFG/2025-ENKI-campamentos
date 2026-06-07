import express from "express";
import {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../controllers/discount.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  discountIdParamsSchema,
  createDiscountBodySchema,
  updateDiscountBodySchema,
} from "../schemas/discount.schema.js";

const router = express.Router();

router.get("/", getDiscounts);

router.get(
  "/:discountId",
  validate({ params: discountIdParamsSchema }),
  getDiscountById
);

router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  validate({ body: createDiscountBodySchema }),
  createDiscount
);

router.patch(
  "/:discountId",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  validate({ params: discountIdParamsSchema, body: updateDiscountBodySchema }),
  updateDiscount
);

router.delete(
  "/:discountId",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  validate({ params: discountIdParamsSchema }),
  deleteDiscount
);

export default router;