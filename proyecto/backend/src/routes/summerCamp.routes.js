import express from "express";
import {
  getSummerCamps,
  getSummerCamp,
  getPublicSummerCampByYear,
  createSummerCamp,
  updateSummerCamp,
  deleteSummerCamp,
} from "../controllers/summerCamp.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import {
  summerCampIdParamsSchema,
  getSummerCampQuerySchema,
  createSummerCampBodySchema,
  updateSummerCampBodySchema,
} from "../schemas/summerCamp.schema.js";

const router = express.Router();

router.get("/", getSummerCamps);

router.get(
  "/search",
  validate({ query: getSummerCampQuerySchema }),
  getSummerCamp
);
router.get("/public/:year", getPublicSummerCampByYear);
router.post(
  "/",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  validate({ body: createSummerCampBodySchema }),
  createSummerCamp
);

router.patch(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  validate({
    params: summerCampIdParamsSchema,
    body: updateSummerCampBodySchema,
  }),
  updateSummerCamp
);

router.delete(
  "/:id",
  requireAuth,
  requireRole("ADMIN", "SUPERADMIN"),
  validate({ params: summerCampIdParamsSchema }),
  deleteSummerCamp
);

export default router;