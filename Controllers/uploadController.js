import { Router } from "express";
import cloudinary from "../utils/cloudinary.js";
import upload from "../middleware/uploadMiddleware.js";

const router = Router();

router.post("/upload", upload.single("image"), async (req, res) => {
  try {
    const result = await cloudinary.uploader.upload(req.file.path);
    res
      .status(200)
      .json({ success: true, message: "Image uploaded", data: result });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Image upload failed" });
  }
});

export default router;
