import express from "express";
import {
  register,
  loginUser,
  logoutUser,
  getMe,
} from "../Controllers/authController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/register", register);
router.post("/login", loginUser);
router.get("/me", authMiddleware, getMe);
router.post("/logout", logoutUser);

export default router;
