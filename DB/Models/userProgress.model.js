import mongoose, { Schema, model } from "mongoose";
import { systemRoles } from "../../src/utils/system-roles.js";
const userProgressSchema = new Schema({
  userId: {
    type: Schema.ObjectId,
    ref: systemRoles.USER,
    required: true
  },
  courseId: {
    type: Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  completedVideos: [{
    type: Schema.ObjectId,
    ref: 'Video'
  }],
  answeredQuestions: [{
    videoId: {
      type: Schema.ObjectId,
      ref: 'Video',
      required: true
    },
    questionId: {
      type: Schema.ObjectId,
      ref: 'Question',
      required: true
    },
    answer: {
      type: String
    },
    isCorrect: {
      type: Boolean
    },
    answeredAt: {
      type: Date,
      default: Date.now
    }
  }],
  courseCompletionStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  lastAccessedVideoId: {
    type: Schema.ObjectId,
    ref: 'Video'
  }
}, {
  timestamps: true
});

userProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const UserProgress = mongoose.models.UserProgress || model("UserProgress", userProgressSchema);
export default UserProgress;