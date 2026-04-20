import express from "express";
import {
  createInscription,
  getInscriptions,
  getInscriptionById,
  cancelInscription,
} from "../controllers/inscription.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {getInscriptionsQuerySchema,inscriptionIdParamsSchema,createInscriptionBodySchema} from "../schemas/inscription.schema.js";
const router = express.Router();

router.post("/",validate({ body: createInscriptionBodySchema }), createInscription);
router.get("/",validate({ query: getInscriptionsQuerySchema }), requireAuth, requireRole("USER", "ADMIN", "SUPERADMIN"), getInscriptions);
router.get("/:id",validate({ params: inscriptionIdParamsSchema }), requireAuth, requireRole("USER", "ADMIN", "SUPERADMIN"), getInscriptionById);
router.patch("/:id/cancel",validate({ params: inscriptionIdParamsSchema }), requireAuth, requireRole("ADMIN", "SUPERADMIN"), cancelInscription);

export default router;