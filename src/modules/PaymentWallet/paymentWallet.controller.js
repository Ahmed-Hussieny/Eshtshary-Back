import PaymentWallet from "../../../DB/Models/paymentWallet.model.js";
import Session from "../../../DB/Models/session.model.js";
import Therapist from "../../../DB/Models/therapist.model.js";
import sendEmailService from "../../services/send-email.services.js";
import { sendApprovalPaymentWallet, sendApprovalPaymentWalletForCourse, sendApprovalPaymentWalletForLiveCourse, sendRejectPaymentWallet, sendRejectPaymentWalletForCourse, sendRejectPaymentWalletForLiveCourse } from "./utils/paymentWallet.handler.js";
import Course from '../../../DB/Models/course.model.js';
import LiveCourse from "../../../DB/Models/liveCourse.model.js";
import { APIFeatures } from "../../utils/api-feature.js";

//Done
export const createPaymentWallet = async (req, res, next) => {
    const { sessionId, therapistId, account, amount } = req.body;
    const userId = req.authUser._id;

    const image = req?.files?.transactionImage?.[0]?.path;
    if (!image) {
        return next({
        cause: 400,
        message: "يرجى تحميل صورة الملف الشخصي",
        });
    }
    const imageUrl = `${process.env.SERVER_URL}/uploads${
        image.split("/uploads")[1]
    }`;

    const paymentWallet = {
        sessionId,
        userId,
        therapistId,
        account,
        amount,
        image: imageUrl,
    };
    const newPaymentWallet = await PaymentWallet.create(paymentWallet);
    if(!newPaymentWallet) {
        return next({
            cause: 400,
            message: "فشل إضافة محفظة الدفع",
        });
    }
    return res.status(201).json({
        message: "تمت إضافة محفظة الدفع بنجاح",
        data: newPaymentWallet,
    });
};
//Done
//& ==================== get all paymentWallets =========================
export const getAllPaymentWallets = async (req, res, next) => {
     const {page, size, ...search} = req.query;
      if(!page) page = 1;
      const feature = new APIFeatures(req.query, PaymentWallet.find({
        status: "pending",
    }).populate("sessionId").populate("userId").populate("therapistId"));
      feature.pagination({page, size});
      feature.search(search);
      const paymentWallets = await feature.mongooseQuery;
    if (!paymentWallets) {
        return next({
            cause: 400,
            message: "فشل استرجاع محفظة الدفع",
        });
    }
    const queryFilter = {};
    if(search.account) queryFilter.account = { $regex: search.account, $options: 'i' };
    queryFilter.status = "pending";
    const numberOfPages = Math.ceil(await PaymentWallet.countDocuments(queryFilter) / (size ? size : 10) )
    return res.status(200).json({
        message: "تم استرجاع محفظة الدفع بنجاح",
        data: paymentWallets,
        numberOfPages
    });
};

//Done
//& ==================== approve paymentWallet by id =========================
export const approvePaymentWallet = async (req, res, next) => {
    const { id } = req.params;
    const paymentWallet = await PaymentWallet.findById(id).populate("userId").populate("therapistId").populate("courseId"). populate("liveCourseId").populate("liveCourseId");
    if (!paymentWallet) {
        return next({
            cause: 400,
            message: "فشل تحديث محفظة الدفع",
        });
    }
    // approve the payment wallet for Sessions
    if(paymentWallet.type === "session") {
    const sessions = [];
    const sessionsId = paymentWallet.sessionId;
    for(const id of sessionsId) {
        const session = await Session.findById(id);
        if (!session) {
            return next({
                cause: 400,
                message: "فشل استرجاع الجلسة",
            });
        }
        session.status = "scheduled";
        await session.save();
        sessions.push(session);
    }

    const isMailsSent = await sendApprovalPaymentWallet({
        user: paymentWallet.userId,
        therapist: paymentWallet.therapistId,
        sessions,
    });
    if(!isMailsSent.status){
        return next({
            cause: 400,
            message: isMailsSent.message,
        });
    }
    }
    // approve the payment wallet for Courses
    if(paymentWallet.type === "course") {
        const course = await Course.findById(paymentWallet.courseId);
        if (!course) {
            return next({
                cause: 400,
                message: "فشل استرجاع الدورة",
            });
        }
        const isUserInCourse = course.enrolledUsers.some(user => user.toString() === paymentWallet.userId.toString());   
        if (isUserInCourse) {
            return next({
                message: "انت بالفعل مشترك في هذه الدورة",
                cause: 400,
            });
        }
        course.enrolledUsers.push(paymentWallet.userId);
        course.enrolledUsersCount++;
        await course.save();
        const isMailsSent = await sendApprovalPaymentWalletForCourse({
            paymentWallet,
        });
        if(!isMailsSent.status){
            return next({
                cause: 400,
                message: isMailsSent.message,
            });
        }
    }
    // approve the payment wallet for liveCourses
    if(paymentWallet.type === "liveCourse") {
        console.log(paymentWallet)
        const liveCourse = await LiveCourse.findById(paymentWallet.liveCourseId);
        if (!liveCourse) {
            return next({
                cause: 400,
                message: "فشل استرجاع الدورة",
            });
        }
        const isUserInCourse = liveCourse.enrolledUsers.some(user => user.toString() === paymentWallet.userId.toString());   
        if (isUserInCourse) {
            return next({
                message: "انت بالفعل مشترك في هذه الدورة",
                cause: 400,
            });
        }
        const isMailsSent = await sendApprovalPaymentWalletForLiveCourse({
            paymentWallet,
        });
        if(!isMailsSent.status){
            return next({
                cause: 400,
                message: isMailsSent.message,
            });
        }
        liveCourse.enrolledUsers.push(paymentWallet.userId);
        liveCourse.enrolledUsersCount++;
        await liveCourse.save();
    };

    paymentWallet.status = "completed";
    await paymentWallet.save();
    
    return res.status(200).json({
        success: true,
        message: "تم قبول محفظة الدفع بنجاح",
        data: paymentWallet,
    });
};

//Done
//& ==================== reject paymentWallet by id =========================
export const rejectPaymentWallet = async (req, res, next) => {
    const { id } = req.params;
    const paymentWallet = await PaymentWallet.findById(id).populate("userId").populate("courseId").populate("liveCourseId");
    if (!paymentWallet) {
        return next({
            cause: 400,
            message: "فشل تحديث محفظة الدفع",
        });
    }
    // reject the payment wallet for Sessions
    if(paymentWallet.type === "session") {
    const sessions = [];
    for(const id of paymentWallet.sessionId) {
        const session = await Session.findById(id);
        if (!session) {
            return next({
                cause: 400,
                message: "فشل استرجاع الجلسة",
            });
        }
        // remove the date booked from the therapist's availability
        const therapist = await Therapist.findById(session.therapistId);
        const dayName = session.date.toLocaleDateString('en-US', { weekday: 'long' });
        therapist.availability.forEach((day) => {
            if (day.day === dayName) {
                const slot = day.slots.find((slot) => slot._id.toString() === session.slotId.toString());
                if (slot) {
                    slot.datesBooked = slot.datesBooked.filter(date => date.toString() !== session.date.toString());
                    slot.bookedBy = slot.bookedBy.filter(userId => userId.toString() !== session.userId.toString());
                }
            }
        });
        await therapist.save();
        // update the session status to rejected
        session.status = "rejected";
        await session.save();
        sessions.push(session);
    }
    const isMailsSent = await sendRejectPaymentWallet({
        user: paymentWallet.userId,
        sessions
    })
    if(!isMailsSent.status){
        return next({
            cause: 400,
            message: isMailsSent.message,
        });
    }
    }
    // reject the payment wallet for Courses
    if(paymentWallet.type === "course") {
        const course = await Course.findById(paymentWallet.courseId);
        if (!course) {
            return next({
                cause: 400,
                message: "فشل استرجاع الدورة",
            });
        }
        const sendRejectPaymentWallet = await sendRejectPaymentWalletForCourse({paymentWallet});
        if(!sendRejectPaymentWallet.status){
            return next({
                cause: 400,
                message: sendRejectPaymentWallet.message,
            });
        }
    }

    // reject the payment wallet for liveCourses
    if(paymentWallet.type === "liveCourse") {
        const liveCourse = await LiveCourse.findById(paymentWallet.liveCourseId);
        if (!liveCourse) {
            return next({
                cause: 400,
                message: "فشل استرجاع الدورة",
            });
        }
        const sendRejectPaymentWallet = await sendRejectPaymentWalletForLiveCourse({paymentWallet});
        if(!sendRejectPaymentWallet.status){
            return next({
                cause: 400,
                message: sendRejectPaymentWallet.message,
            });
        }
    }

    paymentWallet.status = "failed";
    await paymentWallet.save();

   
    return res.status(200).json({
        message: "تم تحديث محفظة الدفع بنجاح",
        data: paymentWallet,
    });
}; 

//& ==================== get paymentWallet by id =========================
export const getPaymentWalletById = async (req, res, next) => {
    const { id } = req.params;
    const paymentWallet = await PaymentWallet.findById(id).populate("sessionId").populate("userId").populate("therapistId");
    if (!paymentWallet) {
        return next({
            cause: 400,
            message: "فشل استرجاع محفظة الدفع",
        });
    }
    return res.status(200).json({
        message: "تم استرجاع محفظة الدفع بنجاح",
        data: paymentWallet,
    });
};

//& ==================== update status of paymentWallet by id =========================
export const updatePaymentWalletStatus = async (req, res, next) => {
    const { id } = req.params;
    const { status } = req.body;
    const paymentWallet = await PaymentWallet.findByIdAndUpdate(id, { status }, { new: true }).populate("sessionId").populate("userId").populate("therapistId");
    if (!paymentWallet) {
        return next({
            cause: 400,
            message: "فشل تحديث محفظة الدفع",
        });
    }
    return res.status(200).json({
        message: "تم تحديث محفظة الدفع بنجاح",
        data: paymentWallet,
    });
}
//& ==================== delete paymentWallet by id =========================
export const deletePaymentWallet = async (req, res, next) => {
    const { id } = req.params;
    const paymentWallet = await PaymentWallet.findByIdAndDelete(id);
    if (!paymentWallet) {
        return next({
            cause: 400,
            message: "فشل حذف محفظة الدفع",
        });
    }
    return res.status(200).json({
        message: "تم حذف محفظة الدفع بنجاح",
        data: paymentWallet,
    });
}
//& ==================== get paymentWallet by userId =========================
export const getPaymentWalletForUser = async (req, res, next) => {
    const { _id } = req.authUser;
    const paymentWallets = await PaymentWallet.find({userId:_id,status:"pending",type:"session"});

    if (!paymentWallets) {
        return next({
            cause: 400,
            message: "فشل استرجاع محفظة الدفع",
        });
    }
    return res.status(200).json({
        message: "تم استرجاع محفظة الدفع بنجاح",
        data: paymentWallets,
    });
}

//Done
//& ==================== get paymentWallet by courseId =========================
export const getPaymentWalletByCourseId = async (req, res, next) => {
    const { courseId } = req.params;
    const { _id } = req.authUser;
    const course = await Course.findById(courseId);
    if (!course) {
        return next({
            cause: 400,
            message: "فشل استرجاع الدورة",
        });
    }
    const isUserInCourse = course.enrolledUsers.some(user => user.toString() === _id.toString());   
    if (isUserInCourse) {
        return next({
            message: "انت بالفعل مشترك في هذه الدورة",
            cause: 400,
        });
    }
    const paymentWallets = await PaymentWallet.findOne({courseId,
        userId: _id,
        status: "pending",
        type: "course",
    });
    if(paymentWallets) {
        return next({
            message: "لديك دفع قيد الانتظار لهذه الدورة",
            cause: 400,
        });
    }
    return res.status(200).json({
        success: true,
        status: "success",
        message: "تم استرجاع محفظة الدفع بنجاح",
        data: paymentWallets,
    });
}

//& ==================== get paymentWallet by courseId =========================
export const getPaymentWalletByLiveCourseId = async (req, res, next) => {
    const { courseId } = req.params;
    const { _id } = req.authUser;
    const liveCourse = await LiveCourse.findById(courseId);
    console.log(courseId);
    if (!liveCourse) {
        return next({
            cause: 400,
            message: "فشل استرجاع الدورة",
        });
    }
    const isUserInCourse = liveCourse.enrolledUsers.some(user => user.toString() === _id.toString());   
    if (isUserInCourse) {
        return next({
            message: "انت بالفعل مشترك في هذه الدورة",
            cause: 400,
        });
    }
    const paymentWallets = await PaymentWallet.findOne({courseId,
        userId: _id,
        status: "pending",
        type: "liveCourse",
    });
    if(paymentWallets) {
        return next({
            message: "لديك دفع قيد الانتظار لهذه الدورة",
            cause: 400,
        });
    }
    return res.status(200).json({
        success: true,
        status: "success",
        message: "تم استرجاع محفظة الدفع بنجاح",
        data: paymentWallets,
    });
}

//& ==================== get paymentWallet by therapistId =========================
export const getPaymentWalletByTherapistId = async (req, res, next) => {
    const { therapistId } = req.params;
    const paymentWallets = await PaymentWallet.find({ therapistId }).populate("sessionId").populate("userId").populate("therapistId");
    if (!paymentWallets) {
        return next({
            cause: 400,
            message: "فشل استرجاع محفظة الدفع",
        });
    }
    return res.status(200).json({
        message: "تم استرجاع محفظة الدفع بنجاح",
        data: paymentWallets,
    });
}




