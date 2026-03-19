import express from "express";
import {
  updateSignedUpStatus,
} from "../controllers/signedUp.controller.js";

const router = express.Router();

router.patch(
  "/inscription/:inscriptionId/week/:weekId/status",
  updateSignedUpStatus
);

export default router;