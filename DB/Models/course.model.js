import mongoose, { model, Schema } from "mongoose";
import { systemRoles } from "../../src/utils/system-roles.js";

const courseSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Please add a course title"],
      trim: true,
      maxlength: [100, "Title cannot be more than 100 characters"],
    },
    description: {
      type: String,
      required: [true, "Please add a description"],
    },
    addedBy: {
      type: mongoose.Schema.ObjectId,
      ref: "Auth",
      required: true,
    },
    priceUSD: {
      type: Number,
      required: [true, "Please add a price"],
      min: [0, "Price cannot be negative"],
    },
    priceEGP: {
      type: Number,
      required: [true, "Please add a price"],
      min: [0, "Price cannot be negative"],
    },
    videos: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "Video",
      },
    ],
    enrolledUsers: [
      {
        type: mongoose.Schema.ObjectId,
        ref: "User",
      },
    ],
    enrolledUsersCount: {
      type: Number,
      default: 0,
    },
    thumbnail: String,
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.models.Course || model("Course", courseSchema);
export default Course;
