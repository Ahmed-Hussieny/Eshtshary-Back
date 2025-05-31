import mongoose, { Schema, model } from "mongoose";

const transferRequestSchema = new Schema({
    therapistId: {
        type: Schema.Types.ObjectId,
        ref: "Therapist",
        required: true,
    },
    transferAccount : {
        type: String,
        required: true,  
    },
    transferMethod: {
        type: String,
        enum: ["vodafoneCash", "paypal", "instapay"],
        required: true,
    },
    currency: {
        type: String,
        enum: ["EGP", "USD"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
        min: 0,
    },
    status: {
        type: String,
        enum: ["pending", "accepted", "rejected"],
        default: "pending",
    },
}, {  
    timestamps: true,
});

const TransferRequest = mongoose.models.TransferRequest || model("TransferRequest", transferRequestSchema);
export default TransferRequest;