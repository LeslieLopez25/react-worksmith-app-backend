import mongoose from "mongoose";

const taskSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
    },
    status: {
      type: String,
      enum: [
        "todo",
        "in-progress",
        "blocked",
        "completed",
        "revise",
        "later-plan",
      ],
      default: "todo",
    },
    project: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Project",
      required: true,
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    urgency: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "low",
    },
    taskType: {
      type: String,
      enum: [
        "frontend",
        "backend",
        "testing",
        "documentation",
        "design",
        "planning",
        "research",
        "deployment",
        "bug-fix",
        "refactor",
        "database",
        "api",
        "ui",
        "ux",
        "review",
        "security",
        "performance",
      ],
    },
  },
  { timestamps: true },
);

export default mongoose.model("Task", taskSchema);
