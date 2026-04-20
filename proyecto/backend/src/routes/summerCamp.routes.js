import express from "express";
import {
  getSummerCamps,
  getSummerCamp,
  createSummerCamp,
  updateSummerCamp,
  deleteSummerCamp,
} from "../controllers/summerCamp.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import {summerCampIdParamsSchema,getSummerCampQuerySchema,createSummerCampBodySchema,updateSummerCampBodySchema} from "../schemas/summerCamp.schema.js";
const router = express.Router();

router.get("/", getSummerCamps);
router.get("/search",validate({ query: getSummerCampQuerySchema }), getSummerCamp);
router.post("/",validate({ body: createSummerCampBodySchema }), createSummerCamp);
router.patch("/:id",validate({ params: summerCampIdParamsSchema , body:updateSummerCampBodySchema}), updateSummerCamp);
router.delete("/:id",validate({ params: summerCampIdParamsSchema }), deleteSummerCamp);

export default router;