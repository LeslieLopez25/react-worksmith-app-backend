import express from "express";
import {
  createProject,
  getAllProjects,
  getProjectById,
  updateProject,
  deleteProject,
  addProjectImage,
  updateProjectImage,
  deleteProjectImage,
  updateProjectNote,
  deleteProjectNote,
} from "../Controllers/projectController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";
import upload from "../middleware/uploadMiddleware.js";

const router = express.Router();
const uploadSingleImage = (req, res, next) => {
  upload.single("image")(req, res, (err) => {
    if (err) return res.status(400).json({ message: err.message });
    next();
  });
};

router.get("/", authMiddleware, getAllProjects);
router.get("/:id", authMiddleware, getProjectById);
router.post("/", authMiddleware, upload.array("images", 5), createProject);
router.post("/:id/images", authMiddleware, uploadSingleImage, addProjectImage);
router.patch(
  "/:id/images/:imageId",
  authMiddleware,
  uploadSingleImage,
  updateProjectImage,
);
router.delete("/:id/images/:imageId", authMiddleware, deleteProjectImage);
router.patch("/:id/notes/:noteId", authMiddleware, updateProjectNote);
router.delete("/:id/notes/:noteId", authMiddleware, deleteProjectNote);
router.patch("/:id", authMiddleware, upload.array("images", 5), updateProject);
router.delete("/:id", authMiddleware, deleteProject);

export default router;
