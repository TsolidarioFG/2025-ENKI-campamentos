import express from "express";
import {
  createInscription,
  getInscriptions,
  getInscriptionById,
  cancelInscription,
} from "../controllers/inscription.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();


router.post("/", createInscription);

router.get("/", requireAuth, requireRole("USER", "ADMIN", "SUPERADMIN"), getInscriptions);
router.get("/:id", requireAuth, requireRole("USER", "ADMIN", "SUPERADMIN"), getInscriptionById);


router.patch("/:id/cancel", requireAuth, requireRole("ADMIN", "SUPERADMIN"), cancelInscription);

export default router;