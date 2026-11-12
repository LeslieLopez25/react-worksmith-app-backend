import Task from "../Models/task.js";
import Project from "../Models/project.js";

export const createTask = async (req, res) => {
  try {
    const project = await Project.findOne({
      _id: req.params.projectId,
      user: req.user._id,
    });
    if (!project) return res.status(404).json({ message: "Project not found" });

    const { title, description, status, urgency, taskType } = req.body;
    if (!title) {
      return res.status(400).json({ message: "Title is required" });
    }

    const task = new Task({
      title,
      description,
      status,
      urgency,
      taskType,
      project: req.params.projectId,
      user: req.user._id,
    });

    const savedTask = await task.save();

    return res.status(201).json(savedTask);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const tasks = await Task.find({
      project: req.params.projectId,
      user: req.user._id,
    }).populate("project", "title");
    res.status(200).json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTask = async (req, res) => {
  try {
    const allowed = ["title", "description", "status", "urgency", "taskType"];
    const updates = {};
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key];
    }

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.taskId,
        user: req.user._id,
      },
      updates,
      { new: true, runValidators: true },
    );
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.taskId,
      user: req.user._id,
    });
    if (!task) return res.status(404).json({ message: "Task not found" });
    res.status(200).json({ message: "Task deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
