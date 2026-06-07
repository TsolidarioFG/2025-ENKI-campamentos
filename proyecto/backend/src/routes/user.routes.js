import express from "express";
import {
  getUsers,
  getUserById,
  createUser,
  updateUser,
  updateUserStatus,
  deleteUser,
  getOwnProfile,
  updateOwnProfile,
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";
import { validate } from "../middleware/validate.middleware.js";
import {
  createUserBodySchema,
  userIdParamsSchema,
  updateUserBodySchema,
  updateUserStatusBodySchema,
  updateOwnProfileBodySchema,
} from "../schemas/user.schema.js";

const router = express.Router();
router.get(
  "/me/profile",
  requireAuth,
  getOwnProfile
);

router.patch(
  "/me/profile",
  requireAuth,
  validate({ body: updateOwnProfileBodySchema }),
  updateOwnProfile
);
router.use(requireAuth, requireRole("SUPERADMIN"));

router.get("/", getUsers);

router.get(
  "/:id",
  validate({ params: userIdParamsSchema }),
  getUserById
);

router.post(
  "/",
  validate({ body: createUserBodySchema }),
  createUser
);

router.patch(
  "/:id",
  validate({ params: userIdParamsSchema, body: updateUserBodySchema }),
  updateUser
);

router.patch(
  "/:id/status",
  validate({ params: userIdParamsSchema, body: updateUserStatusBodySchema }),
  updateUserStatus
);

router.delete(
  "/:id",
  validate({ params: userIdParamsSchema }),
  deleteUser
);

export default router;