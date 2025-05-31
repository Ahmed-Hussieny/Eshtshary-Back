import mongoose, { model, Schema } from "mongoose";
import { systemRoles } from '../../src/utils/system-roles.js';

const userSchema = new Schema({
    username: {
        type: String,
        required: true,
    },
    email: {
        type: String,
        required: true,
        trim: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    role: {
        type: String,
        default: systemRoles.USER,
    },
    // Personal Information
    nationality: {
        type: String,
        default: undefined,
    },
    residence: {
        type: String,
        default: undefined,
    },
    age: {
        type: Number,
        default: undefined,
    },
    phoneNumber: {
        type: String,
        default: undefined,
    },
    specialization: [
        {
            type: String,
            default: undefined,
        }
    ],
    isVerified: {
        type: Boolean,
        default: false,
    },
    token:{
        type: String,
        default: undefined,
    },
    resetPasswordToken:{
        type: String,
        default: undefined
    },
    resetPasswordTokenExpires :{
        type: Date,
        default: undefined,
    },
    certificates: [{
        courseId: {
            type: Schema.Types.ObjectId,
            ref: "Course",
        },
        certificateUrl: {
            type: String,
            default: undefined,
        },
    }],
}, {
    timestamps: true,
});

const User = mongoose.models.User || model("User", userSchema);

export default User;
