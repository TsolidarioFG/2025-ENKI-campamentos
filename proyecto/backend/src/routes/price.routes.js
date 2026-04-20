import express from "express";
import {
  getPrices,
  createPrice,
  updatePrice,
} from "../controllers/price.controller.js";
import { validate } from "../middleware/validate.middleware.js";
import { getPricesQuerySchema ,createPriceBodySchema,updatePriceBodySchema } from "../schemas/price.schema.js";
const router = express.Router();

router.get("/",validate({ query: getPricesQuerySchema }), getPrices);
router.post("/",validate({ body: createPriceBodySchema }), createPrice);
router.patch("/",validate({ body: updatePriceBodySchema }), updatePrice);

export default router;