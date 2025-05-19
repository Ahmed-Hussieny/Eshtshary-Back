import mongoose, { model, Schema } from "mongoose";

const questionSchema = new Schema(
  {
    videoId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Video',
    required: true
  },
  questionText: {
    type: String,
    required: [true, 'Please add the question text']
  },
  options: {
    type: [String]
  },
  correctAnswer: {
    type: String,
    required: [true, 'Please add the correct answer']
  },
  type: {
    type: String,
    enum: ['multiple-choice', 'text-answer'],
    default: 'multiple-choice'
  },
  },
  {
    timestamps: true
  }
);


const Question = mongoose.models.Question || model("Question", questionSchema);
export default Question;
