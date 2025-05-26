import mongoose, { model, Schema } from "mongoose";

const rateSchema = new Schema({
    userId: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    therapistId: {
        type: Schema.Types.ObjectId,
        ref: "Therapist",
        required: true,
    },
    sessionId: {
        type: Schema.Types.ObjectId,
        ref: "Session",
        required: true,
    },
    rate: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        default: ""
    },
    status: {
        type: String,
        enum: ["no-show", "show"],
        default: "no-show"
    }
}, {
    timestamps: true
});

const Rate = mongoose.models.Rate || model('Rate', rateSchema);
export default Rate;