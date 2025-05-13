import mongoose, { model, Schema } from "mongoose";
import { systemRoles } from "../../src/utils/system-roles.js";

const enrollmentSchema = new Schema(
  {
    userId: {
    type: mongoose.Schema.ObjectId,
    ref: systemRoles.USER,
    required: true
  },
  courseId: {
    type: mongoose.Schema.ObjectId,
    ref: 'Course',
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    required: true,
    enum: ['completed', 'pending', 'failed'],
    default: 'pending'
  },
  paymentDetails: {
    type: Object
  }
  },
  {
    timestamps: true,
  }
);
enrollmentSchema.index({ userId: 1, courseId: 1 }, { unique: true });

const Enrollment = mongoose.models.Enrollment || model("Enrollment", enrollmentSchema);
export default Enrollment;
