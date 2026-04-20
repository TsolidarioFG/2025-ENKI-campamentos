import express from "express";
import {
  getUsers,
  createUser,
  updateUserStatus,
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createUserBodySchema,
  userIdParamsSchema,
  updateUserStatusBodySchema,
} from "../schemas/user.schema.js";

const router = express.Router();

router.use(requireAuth, requireRole("SUPERADMIN"));

router.get("/", getUsers);
router.post("/", validate({ body: createUserBodySchema }), createUser);
router.patch(
  "/:id/status",
  validate({ params: userIdParamsSchema, body: updateUserStatusBodySchema }),
  updateUserStatus
);

export default router;