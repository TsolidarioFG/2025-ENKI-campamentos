import express from "express";
import {
  getSummerCamps,
  getSummerCamp,
  createSummerCamp,
  updateSummerCamp,
  deleteSummerCamp,
} from "../controllers/summerCamp.controller.js";

const router = express.Router();

router.get("/", getSummerCamps);
router.get("/search", getSummerCamp);
router.post("/", createSummerCamp);
router.patch("/:id", updateSummerCamp);
router.delete("/:id", deleteSummerCamp);

export default router;