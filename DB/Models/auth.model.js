import mongoose, { model, Schema } from "mongoose";
import { systemRoles } from '../../src/utils/system-roles.js';

const authSchema = new Schema({
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
        default: systemRoles.ADMIN,
    },
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
    }
}, {
    timestamps: true,
});

const Auth = mongoose.models.Auth || model("Auth", authSchema);

export default Auth;
