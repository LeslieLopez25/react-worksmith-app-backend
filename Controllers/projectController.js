import mongoose from "mongoose";
import Project from "../Models/project.js";
import fs from "fs";
import cloudinary from "../utils/cloudinary.js";

const findOwnedProject = (req) =>
  Project.findOne({ _id: req.params.id, user: req.user._id });

const removeTempFile = (req) => {
  if (req.file) fs.unlink(req.file.path, () => {});
};

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
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ message: "Project not found" });
    }
    const project = await Project.findOne({
      _id: req.params.id,
      user: req.user._id,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });
    res.status(200).json(project);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Failed to load project" });
  }
};

export const updateProject = async (req, res) => {
  try {
    const allowed = [
      "title",
      "description",
      "status",
      "projectType",
      "isDraft",
      "notes",
    ];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const project = await Project.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user._id,
      },
      updates,
      { new: true, runValidators: true },
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

export const updateProjectImage = async (req, res) => {
  try {
    const project = await findOwnedProject(req);
    const image = project?.images.id(req.params.imageId);
    if (!image) {
      removeTempFile(req);
      return res.status(404).json({ message: "Image not found" });
    }

    const { title, description } = req.body;
    if (title !== undefined) image.filename = title;
    if (description !== undefined) image.description = description;

    let oldPublicId = null;
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: "worksmith",
      });
      removeTempFile(req);
      oldPublicId = image.publicId;
      image.url = result.secure_url;
      image.publicId = result.public_id;
    }

    await project.save();

    // Only remove the old file from Cloudinary after the save succeeded
    if (oldPublicId) {
      cloudinary.uploader
        .destroy(oldPublicId)
        .catch((err) => console.error(err));
    }

    res.status(200).json(project);
  } catch (error) {
    removeTempFile(req);
    res.status(500).json({ message: error.message });
  }
};

export const deleteProjectImage = async (req, res) => {
  try {
    const project = await findOwnedProject(req);
    const image = project?.images.id(req.params.imageId);
    if (!image) return res.status(404).json({ message: "Image not found" });

    const publicId = image.publicId;
    project.images.pull(req.params.imageId);
    await project.save();

    if (publicId) {
      cloudinary.uploader.destroy(publicId).catch((err) => console.error(err));
    }

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateProjectNote = async (req, res) => {
  try {
    const { content } = req.body;
    if (!content || !content.trim()) {
      return res.status(400).json({ message: "Note content is required" });
    }

    const project = await findOwnedProject(req);
    const note = project?.notes.id(req.params.noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    note.content = content;
    await project.save();
    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteProjectNote = async (req, res) => {
  try {
    const project = await findOwnedProject(req);
    const note = project?.notes.id(req.params.noteId);
    if (!note) return res.status(404).json({ message: "Note not found" });

    project.notes.pull(req.params.noteId);
    await project.save();

    res.status(200).json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
