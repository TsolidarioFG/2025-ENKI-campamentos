import express from "express";
import {
  getPayments,
  getPaymentById,
  registerPayment,
  createExtraPayment,
} from "../controllers/payments.controller.js";

const router = express.Router();

router.get("/", getPayments);
router.get("/:id", getPaymentById);
router.post("/extra", createExtraPayment);
router.patch("/:id/pay", registerPayment);

export default router;