import express from "express";
import {
  createExtraForm,
  getExtraFormByParticipantId,
  updateExtraForm,
  deleteExtraForm,
  deleteSportById,
  deleteAllSportsByParticipantId,
  deleteFearById,
  deleteAllFearsByParticipantId,
  deleteCommunicationById,
  deleteAllCommunicationsByParticipantId,
  deleteFoodSensitivityById,
  deleteAllFoodSensitivitiesByParticipantId,
} from "../controllers/extraform.controller.js";

import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.post("/", requireAuth, createExtraForm);
router.get("/:participantId", requireAuth, getExtraFormByParticipantId);
router.patch("/:participantId", requireAuth, updateExtraForm);
router.delete("/:participantId", requireAuth, deleteExtraForm);
router.delete("/sports/:sportId", requireAuth, deleteSportById);
router.delete("/sports/all/:participantId", requireAuth, deleteAllSportsByParticipantId);
router.delete("/fears/:fearId", requireAuth, deleteFearById);
router.delete("/fears/all/:participantId", requireAuth, deleteAllFearsByParticipantId);
router.delete("/communication/:communicationId", requireAuth, deleteCommunicationById);
router.delete("/communication/all/:participantId", requireAuth, deleteAllCommunicationsByParticipantId);
router.delete("/foodsensitivities/:foodSensitivityId", requireAuth, deleteFoodSensitivityById);
router.delete("/foodsensitivities/all/:participantId", requireAuth, deleteAllFoodSensitivitiesByParticipantId);


export default router;