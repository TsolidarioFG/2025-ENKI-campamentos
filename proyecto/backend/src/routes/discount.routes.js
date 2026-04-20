import express from "express";
import {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../controllers/discount.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  discountIdParamsSchema,
  createDiscountBodySchema,
  updateDiscountBodySchema,
} from "../schemas/discount.schema.js";
const router = express.Router();

router.get("/", getDiscounts);
router.post("/", validate({ body: createDiscountBodySchema }), createDiscount);
router.get("/:discountId", validate({ params: discountIdParamsSchema }), getDiscountById);
router.patch(
  "/:discountId",
  validate({ params: discountIdParamsSchema, body: updateDiscountBodySchema }),
  updateDiscount
);
router.delete("/:discountId", validate({ params: discountIdParamsSchema }), deleteDiscount);

export default router;