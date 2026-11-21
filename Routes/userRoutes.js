import express from "express";
import {
  getUser,
  updateUser,
  updatePassword,
  deleteUser,
  updateTheme,
} from "../Controllers/userController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/profile", authMiddleware, getUser);
router.patch("/profile", authMiddleware, updateUser);
router.patch("/profile/password", authMiddleware, updatePassword);
router.patch("/profile/theme", authMiddleware, updateTheme);
router.delete("/profile", authMiddleware, deleteUser);

export default router;
