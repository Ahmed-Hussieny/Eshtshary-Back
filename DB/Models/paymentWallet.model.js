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
        ref: "Therapist"
    },
    account:{
        type: String,
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    transactionImage:{
        type: String,
        default: undefined,
    },
    paymentMethod:{
        type: String,
        enum: ["vodafoneCash", "instaPay", "card"],
        default: "vodafoneCash",
    },
    status: {
        type: String,
        enum: ["pending", "completed", "failed"],
        default: "pending",
    },
    type: {
        type: String,
        enum: ["session", "course", "product", "liveCourse"],
        default: "session",
    },
    courseId: {
        type: Schema.Types.ObjectId,
        ref: "Course",
        default: undefined,
    },
    liveCourseId: {
        type: Schema.Types.ObjectId,
        ref: "LiveCourse",
        default: undefined,
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