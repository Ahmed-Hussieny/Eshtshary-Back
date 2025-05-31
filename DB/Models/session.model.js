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
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      enum: ["EGP", "USD"],
      required: true,
    },
    status: {
      type: String,
      enum: ["scheduled", "completed", "canceled", "no-show","pending", "rejected"],
      default: "scheduled",
    },
    notes: {
      type: String,
    },
    meetingLink: {
      type: String,
    },
    is24HourReminderSent: {
        type: Boolean,
        default: false,
    },
    is1HourReminderSent: {
        type: Boolean,
        default: false,
    },
    username: {
      type: String,
      default: "",
    },
    typeOfSession: {
      type: String,
      enum: ["لأول مرة", "رحلة علاجية", "استشارة", "جلسة متابعة"],
      default: "لأول مرة",
    },
    lastDate: {
      type: String,
      default: "",
    },
    challenges: [
      {
        type: String,
        default: "",
      },
    ],
    

  },
  { timestamps: true }
);

const Session = mongoose.models.Session || model("Session", sessionSchema);

export default Session;
