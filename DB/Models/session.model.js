import mongoose, { Schema } from "mongoose";
import { systemRoles } from "../../src/utils/system-roles.js";
import { model } from "mongoose";

const sessionSchema = new Schema(
  {
    therapistId: {
      type: Schema.Types.ObjectId,
      ref: systemRoles.THERAPIST,
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: systemRoles.USER,
      required: true,
    },
    slotId: {
      type: String,
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    startTime: {
      type: String,
      required: true,
    },
    endTime: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "canceled", "no-show","pending"],
      default: "scheduled",
    },
    notes: {
      type: String,
    },
    meetingLink: {
      type: String,
    },
  },
  { timestamps: true }
);

const Session = mongoose.models.Session || model("Session", sessionSchema);

export default Session;
