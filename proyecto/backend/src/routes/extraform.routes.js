import express from "express";
import {
  createExtraForm,
  getExtraFormByParticipantId,
  updateExtraForm,
  deleteExtraFormByParticipantId,
  deleteSportById,
  deleteAllSportsByParticipantId,
  deleteFearById,
  deleteAllFearsByParticipantId,
  deleteCommunicationById,
  deleteAllCommunicationByParticipantId,
  deleteFoodSensitivityById,
  deleteAllFoodSensitivitiesByParticipantId,
} from "../controllers/extraform.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { participantIdParamsSchema,sportIdParamsSchema,fearIdParamsSchema ,communicationIdParamsSchema,foodSensitivityIdParamsSchema,createExtraFormBodySchema,updateExtraFormBodySchema } from "../schemas/extraForm.chema.js";
import { requireAuth} from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/",validate({ body: createExtraFormBodySchema }),createExtraForm);
router.get("/:participantId",validate({ params: participantIdParamsSchema }),getExtraFormByParticipantId);
router.patch("/:participantId",validate({ body: updateExtraFormBodySchema }),updateExtraForm);
router.delete("/:participantId",validate({ params: participantIdParamsSchema }),deleteExtraFormByParticipantId);
router.delete("/sports/:sportId",validate({ params: sportIdParamsSchema }), requireAuth, deleteSportById);
router.delete("/sports/all/:participantId", requireAuth, deleteAllSportsByParticipantId);
router.delete("/fears/:fearId",validate({ params: fearIdParamsSchema }), requireAuth, deleteFearById);
router.delete("/fears/all/:participantId", requireAuth, deleteAllFearsByParticipantId);
router.delete("/communication/:communicationId",validate({ params: communicationIdParamsSchema }), requireAuth, deleteCommunicationById);
router.delete("/communication/all/:participantId", requireAuth, deleteAllCommunicationByParticipantId);
router.delete("/foodsensitivities/:foodSensitivityId",validate({ params: foodSensitivityIdParamsSchema }), requireAuth, deleteFoodSensitivityById);
router.delete("/foodsensitivities/all/:participantId", requireAuth, deleteAllFoodSensitivitiesByParticipantId);


export default router;