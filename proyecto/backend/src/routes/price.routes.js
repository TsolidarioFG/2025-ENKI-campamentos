import express from "express";
import {
  getPrices,
  getPricesByWeek,
  createPrice,
} from "../controllers/price.controller.js";

const router = express.Router();

router.get("/", getPrices);
router.get("/week/:weekId", getPricesByWeek);
router.post("/", createPrice);

export default router;