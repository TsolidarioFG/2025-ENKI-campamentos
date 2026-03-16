import express from "express";
import {
  getSummerCamps,
  createSummerCamp,
} from "../controllers/summerCamp.controller.js";

const router = express.Router();

router.get("/", getSummerCamps);
router.post("/", createSummerCamp);

export default router;