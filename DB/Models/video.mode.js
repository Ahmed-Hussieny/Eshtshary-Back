import mongoose, { model, Schema } from "mongoose";

const videoSchema = new Schema(
  {
    courseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  title: {
    type: String,
    required: [true, 'Please add a video title'],
    trim: true
  },
  videoUrl: {
    type: String,
    required: [true, 'Please provide a video URL']
  },
  duration: {
    type: Number
  },
  order: {
    type: Number,
    required: true,
    default: 0
  },
  questions: [{
    type: mongoose.Schema.ObjectId,
    ref: 'Question'
  }],
  },
  {
    timestamps: true,
  }
);

const Video = mongoose.models.Video || model("Video", videoSchema);
export default Video;
