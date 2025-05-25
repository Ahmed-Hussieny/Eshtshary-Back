import User from "../../../DB/Models/user.model.js";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken';
import sendEmailService from '../../services/send-email.services.js';
import { verificationEmailTemplate } from '../../utils/verify-email-templet.js';

//& ====================== SIGN UP ======================
export const signUp = async (req, res, next) => {
    const { username, email, password } = req.body;
    // Check if the user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        return next({
            cause: 409,
            message: "هذا البريد الإلكتروني مستخدم بالفعل",
        });
    }
    // hash the password
    const hashedPassword = await bcrypt.hash(password, +process.env.SALT_ROUNDS);
    // Generate a token
    const userToken = jwt.sign(
        { email, username },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
    // Send a verification email
    const isEmailSent = await sendEmailService({
        to: email,
        subject: 'Email verification',
        message: verificationEmailTemplate(username,`${process.env.CLIENT_URL}/verifyEmail/${userToken}`)
    });
    if(!isEmailSent) return next({message: 'Email is not sent', cause: 500});
    // Create a new user
    const newUser = await User.create({
        username,
        email,
        password: hashedPassword,
    });
    if(!newUser) {
        return next({
            cause: 500,
            message: "فشل إنشاء المستخدم",
        });
    }
    // Send a response
    return res.status(201).json({
        status: "success",
        success: true,
        message: "تم إنشاء المستخدم بنجاح",
        data: {
            user: {
                id: newUser._id,
                username: newUser.username,
                email: newUser.email,
            },
        },
    });
};

//& ====================== VERIFY EMAIL ======================
export const verifyEmail = async (req, res, next) => {
    const { token } = req.params;
    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
        return next({
            cause: 401,
            message: "رمز التحقق غير صالح",
        });
    }
    // Check if the user exists
    const existingUser = await User.findOne({ email: decodedToken.email });
    if (!existingUser) {
        return next({
            cause: 404,
            message: "المستخدم غير موجود",
        });
    }
    // Update the user's isVerified field
    existingUser.isVerified = true;
    await existingUser.save();
    // Send a response
    return res.status(200).json({
        status: "success",
        success: true,
        message: "تم التحقق من البريد الإلكتروني بنجاح",
    });
};

//& ====================== SIGN IN ======================
export const signIn = async (req, res, next) => {
    const { email, password } = req.body;
    // Check if the user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        return next({
            cause: 401,
            message: "البريد الإلكتروني غير صحيح",
        });
    }
    // Check if the password is correct
    const isPasswordValid = await bcrypt.compare(password, existingUser.password);
    if (!isPasswordValid) {
        return next({
            cause: 401,
            message: "كلمة المرور غير صحيحة",
        });
    }
    // Generate a token
    const token = jwt.sign(
        { id: existingUser._id, role: existingUser.role },
        process.env.JWT_SECRET,
        // { expiresIn: "1h" }
    );
    existingUser.token = token;
    await existingUser.save();
    // Send a response
    return res.status(200).json({
        status: "success",
        success: true,
        message: "تم تسجيل الدخول بنجاح",
        data: {
            user: {
                id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
                role: existingUser.role,
            },
            token,
        },
    });
};

//& ====================== FORGOT PASSWORD ======================
export const forgotPassword = async (req, res, next) => {
    const { email } = req.body;
    // Check if the user exists
    const existingUser = await User.findOne({ email });
    if (!existingUser) {
        return next({
            cause: 404,
            message: "المستخدم غير موجود",
        });
    }
    // Generate a reset password token
    const resetPasswordToken = jwt.sign(
        { id: existingUser._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
    // Update the user's resetPasswordToken and resetPasswordTokenExpires fields
    existingUser.resetPasswordToken = resetPasswordToken;
    existingUser.resetPasswordTokenExpires = Date.now() + 3600000; // 1 hour
    await existingUser.save();
    // Send a reset password email
    const isEmailSent = await sendEmailService({
        to: email,
        subject: 'Reset Password',
        message: verificationEmailTemplate(existingUser.username,`${process.env.CLIENT_URL}/resetPassword/${resetPasswordToken}`)
    });
    if(!isEmailSent) return next({message: 'Email is not sent', cause: 500});
    // Send a response
    return res.status(200).json({
        status: "success",
        success: true,
        message: "تم إرسال بريد إعادة تعيين كلمة المرور بنجاح",
    });
}
//& ====================== verifyResetToken ======================
export const verifyResetToken = async (req, res, next) => {
    // 1- get the reset code from the request body
    const { token } = req.query;

    // 2- Find the user by email
    const user = await User.findOne({
        resetPasswordToken: token,
        resetPasswordTokenExpires: { $gt: Date.now() }, // Check expiry
      });
    if (!user) return next({ message: " لقد انتهت مدة التغيير يمكنك ارسال رمز التغيير مرة اخرى", cause: 404 });
    return res.status(200).json({success: true, message: "Token is valid"});
};

//& ====================== RESET PASSWORD ======================
export const resetPassword = async (req, res, next) => {
    const { token } = req.params;
    const { password } = req.body;
    // Verify the token
    const decodedToken = jwt.verify(token, process.env.JWT_SECRET);
    if (!decodedToken) {
        return next({
            cause: 401,
            message: "رمز إعادة تعيين كلمة المرور غير صالح",
        });
    }
    // Check if the user exists
    const existingUser = await User.findById(decodedToken.id);
    if (!existingUser) {
        return next({
            cause: 404,
            message: "المستخدم غير موجود",
        });
    }
    // Check if the reset password token is valid
    if (existingUser.resetPasswordToken !== token || existingUser.resetPasswordTokenExpires < Date.now()) {
        return next({
            cause: 401,
            message: "رمز إعادة تعيين كلمة المرور غير صالح أو منتهي الصلاحية",
        });
    }
    // Hash the new password
    const hashedPassword = await bcrypt.hash(password, +process.env.SALT_ROUNDS);
    // Update the user's password and clear the reset password token fields
    existingUser.password = hashedPassword;
    existingUser.resetPasswordToken = undefined;
    existingUser.resetPasswordTokenExpires = undefined;
    await existingUser.save();
    // Send a response
    return res.status(200).json({
        status: "success",
        success: true,
        message: "تم إعادة تعيين كلمة المرور بنجاح",
    });
}

//& ====================== GET ALL USERS ======================
export const getAllUsers = async (req, res, next) => {
    const users = await User.find({}).select("-password -__v");
    if (!users) {
        return next({
            cause: 404,
            message: "لا يوجد مستخدمين",
        });
    }
    return res.status(200).json({
        status: "success",
        success: true,
        message: "تم استرجاع جميع المستخدمين بنجاح",
        data: {
            users,
        },
    });
}

//& ====================== GET USER BY ID ======================
export const getUserById = async (req, res, next) => {
    const { id } = req.params;
    const user = await User.findById(id).select("-password -__v");
    if (!user) {
        return next({
            cause: 404,
            message: "المستخدم غير موجود",
        });
    }
    return res.status(200).json({
        status: "success",
        success: true,
        message: "تم استرجاع المستخدم بنجاح",
        data: {
            user,
        },
    });
}

//& ====================== UPDATE USER ======================
export const updateUser = async (req, res, next) => {
    const { id } = req.params;
    const { username, email, oldPassword, newPassword } = req.body;
    // Check if the user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
        return next({
            cause: 404,
            message: "المستخدم غير موجود",
        });
    }
    // Update the user's fields
    existingUser.username = username || existingUser.username;
    if(email) {
        // Check if the email is already used by another user
        const emailExists = await User.findOne({ email });
        if (emailExists && emailExists._id.toString() !== id) {
            return next({
                cause: 409,
                message: "هذا البريد الإلكتروني مستخدم بالفعل",
            });
        }
        existingUser.email = email;
    }
    // Check if the old password is correct
    if (oldPassword && newPassword) {
        const isPasswordValid = await bcrypt.compare(oldPassword, existingUser.password);
        if (!isPasswordValid) {
            return next({
                cause: 401,
                message: "كلمة المرور القديمة غير صحيحة",
            });
        }
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, +process.env.SALT_ROUNDS);
        existingUser.password = hashedPassword;
    }
    await existingUser.save();
    // Send a response
    return res.status(200).json({
        status: "success",
        success: true,
        message: "تم تحديث المستخدم بنجاح",
        data: {
            user: {
                id: existingUser._id,
                username: existingUser.username,
                email: existingUser.email,
            },
        },
    });
}

//& ====================== DELETE USER ======================
export const deleteUser = async (req, res, next) => {
    const { id } = req.params;
    // Check if the user exists
    const existingUser = await User.findById(id);
    if (!existingUser) {
        return next({
            cause: 404,
            message: "المستخدم غير موجود",
        });
    }
    // Delete the user
    await User.findByIdAndDelete(id);
    if (!existingUser) {
        return next({
            cause: 500,
            message: "فشل حذف المستخدم",
        });
    }
    // Send a response
    return res.status(200).json({
        status: "success",
        success: true,
        message: "تم حذف المستخدم بنجاح",
    });
}
