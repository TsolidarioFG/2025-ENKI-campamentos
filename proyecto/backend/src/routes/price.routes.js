import express from "express";
import {
  getPrices,
  createPrice,
  updatePrice,
} from "../controllers/price.controller.js";

const router = express.Router();

router.get("/", getPrices);
router.post("/", createPrice);
router.patch("/", updatePrice);

export default router;