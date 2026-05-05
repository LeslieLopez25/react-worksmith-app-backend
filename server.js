import { setServers } from "node:dns/promises";
setServers(["1.1.1.1", "8.8.8.8"]);

dotenv.config();

import express from "express";
import dotenv from "dotenv";
import mongoose from "mongoose";
import cors from "cors";
import cookieParser from "cookie-parser";
import userRoutes from "./Routes/userRoutes.js";
import authRoutes from "./Routes/authRoutes.js";
import taskRoutes from "./Routes/taskRoutes.js";
import projectRoutes from "./Routes/projectRoutes.js";

const MONGODB_URL = process.env.MONGO_URI;

mongoose
  .connect(MONGODB_URL)
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
  }),
);

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    message: "Worksmith API is healthy",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/tasks", taskRoutes);

const PORT = process.env.PORT || 7000;
app.listen(PORT, () => {
  console.log(`Server running on ${PORT}`);
});
