import express from "express";
import { login, me } from "../controllers/auth.controller.js";
import { requireAuth } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import { loginBodySchema } from "../schemas/auth.schema.js";

const router = express.Router();

router.post("/login", validate({ body: loginBodySchema }), login);
router.get("/me", requireAuth, me);

export default router;