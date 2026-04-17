import express from "express";
import {
  getDiscounts,
  getDiscountById,
  createDiscount,
  updateDiscount,
  deleteDiscount,
} from "../controllers/discount.controller.js";
const router = express.Router();

router.get("/", getDiscounts);
router.get("/:discountId", getDiscountById);
router.post("/", createDiscount);
router.patch("/:discountId", updateDiscount);
router.delete("/:discountId", deleteDiscount);

export default router;