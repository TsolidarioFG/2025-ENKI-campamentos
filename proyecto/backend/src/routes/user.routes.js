import express from "express";
import {
  getUsers,
  createUser,
  updateUserStatus,
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middleware/auth.middleware.js";

const router = express.Router();

router.use(requireAuth, requireRole("SUPERADMIN"));

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id/status", updateUserStatus);

export default router;