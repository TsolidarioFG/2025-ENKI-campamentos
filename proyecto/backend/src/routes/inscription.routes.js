import express from "express";
import {
  createInscription,
  getInscriptions,
  getInscriptionById,
} from "../controllers/inscription.controller.js";

const router = express.Router();

router.post("/", createInscription);
router.get("/", getInscriptions);
router.get("/:id", getInscriptionById);

export default router;