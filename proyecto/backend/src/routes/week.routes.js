import express from "express";
import {
  getWeeks,
  createWeek,
  updateWeek,
  deleteWeek,
} from "../controllers/week.controller.js";

const router = express.Router();

router.get("/", getWeeks);
router.post("/", createWeek);
router.patch("/summercamp/:summerCampId/week/:number", updateWeek);
router.delete("/summercamp/:summerCampId/week/:number", deleteWeek);

export default router;