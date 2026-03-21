import express from "express";
import {
  getUsers,
  createUser,
  updateUserStatus,
} from "../controllers/user.controller.js";
import { requireAuth, requireRole } from "../middlewares/auth.middleware.js";

const router = express.Router();

router.use(requireAuth, requireRole("SUPERADMIN"));

router.get("/", getUsers);
router.post("/", createUser);
router.patch("/:id/status", updateUserStatus);

export default router;