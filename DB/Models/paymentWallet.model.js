import mongoose, { model, Schema } from "mongoose";

const paymentWalletSchema = new Schema({
    sessionId: [{
        type: Schema.Types.ObjectId,
        ref: "Session",
        required: true,
    }],
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
    account:{
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    paymentImage:{
        type: String,
        default: undefined,
    },
    paymentMethod:{
        type: String,
        enum: ["vodafoneCash", "instapay"],
        default: "vodafoneCash",
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },
    currency: {
        type: String,
        enum: ["EGP", "USD"],
        default: "EGP",
    },
}, {
    timestamps: true
})


const PaymentWallet = mongoose.models.PaymentWallet || model("PaymentWallet", paymentWalletSchema);
export default PaymentWallet;