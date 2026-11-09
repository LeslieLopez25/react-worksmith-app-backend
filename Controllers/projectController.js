import Project from "../Models/project.js";
import fs from "fs";
import cloudinary from "../utils/cloudinary.js";

export const createProject = async (req, res) => {
  try {
    const { title, description, status, projectType, isDraft } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const project = new Project({
      title,
      description,
      status,
      projectType,
      isDraft: isDraft || false,
      user: req.user._id,
    });

    const savedProject = await project.save();

    res.status(201).json(savedProject);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      user: req.user._id,
      isDraft: false,
    }).populate("user", "name email");
    res.status(200).json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id).populate(
      "user",
      "name email",
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProject = async (req, res) => {
  try {
    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      req.body,
      { new: true },
    );
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const addProjectImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Image file is required" });
    }

    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!project) {
      fs.unlink(req.file.path, () => {});
      return res.status(404).json({ message: "Project not found" });
    }

    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "worksmith",
    });
    fs.unlink(req.file.path, () => {});

    project.images.push({
      url: result.secure_url,
      publicId: result.public_id,
      filename: req.body.title,
      description: req.body.description,
    });
    await project.save();

    res.status(201).json(project);
  } catch (error) {
    if (req.file) fs.unlink(req.file.path, () => {});
    res.status(500).json({ message: error.message });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const project = await Project.findOneAndDelete({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json({ message: "Project deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
