import axios from "axios";
import LiveCourse from "../../../DB/Models/liveCourse.model.js";
import PaymentWallet from "../../../DB/Models/paymentWallet.model.js";
import User from "../../../DB/Models/user.model.js";
import { createCharge } from "../../services/tapPayment.js";
import sendEmailService from "../../services/send-email.services.js";

//& ====================== ADD LIVE COURSE ====================== &//
export const addLiveCourse = async (req, res, next) => {
    const { title, description, priceEGP, priceUSD, sessions } = req.body;
    
    const parseSessions = sessions ? JSON.parse(sessions) : [];
    if (parseSessions.length === 0) {
        return next({
            message: "At least one session is required",
            cause: 400,
        });
    }

    const liveCourse = {
        title,
        description,
        sessions: parseSessions.map(session => ({
            title: session.title,
            description: session.description,
            date: new Date(session.date),
            time: session.time,
            link: session.link || "", // Optional link
        })),
        image: req.files?.image ? `${process.env.SERVER_URL}/uploads/LiveCourses/${req.files.image[0].filename}` : "",
        priceEGP,
        priceUSD
    };
    const newLiveCourse = await LiveCourse.create(liveCourse);
    if (!newLiveCourse) {
        return next({
            message: "Live course not created",
            cause: 400,
        });
    }
    return res.status(201).json({
        success: true,
        message: "Live course added successfully",
        newLiveCourse,
    });
};

//& ====================== GET LIVE COURSES ====================== &//
export const getLiveCourses = async (req, res, next) => {
    const liveCourses = await LiveCourse.find().sort({ createdAt: -1 });
        return res.status(200).json({
            success: true,
            message: "Live courses retrieved successfully",
            liveCourses,
        });
};
//& ====================== GET LIVE COURSE BY ID ====================== &//
export const getLiveCourseById = async (req, res, next) => {
    const { id } = req.params;
    if (!id) {
        return next({
            message: "Live course ID is required",
            cause: 400,
        });
    }
    
    try {
        const liveCourse = await LiveCourse.findById(id);
        if (!liveCourse) {
            return next({
                message: "Live course not found",
                cause: 404,
            });
        }
        return res.status(200).json({
            success: true,
            message: "Live course retrieved successfully",
            liveCourse,
        });
    } catch (error) {
        return next({
            message: "Server error",
            cause: 500,
            error: error.message,
        });
    }
};

//& ====================== ENROLL IN LIVE COURSE ====================== &//
export const enrollInLiveCourse = async (req, res, next) => {
    const { courseId } = req.params;
    const { id: userId } = req.authUser;
    const { paymentMethod, amount, currency, transferNumber, transferAccount } = req.body;
    if(!req.files?.transactionImage) {
        return next({ message: "يرجى رفع صورة الدفع", status: 400 });
    }
    const transactionImageUrl = `${process.env.SERVER_URL}/uploads${
        req.files.transactionImage[0].path.split("/uploads")[1]
    }`;

    const liveCourse = await LiveCourse.findById(courseId);
    if (!liveCourse) {
        return next({
            message: "Live course not found",
            cause: 404,
        });
    }

    if (liveCourse.enrolledUsers.includes(userId)) {
        return next({
            message: "أنت مسجل بالفعل في هذه الدورة",
            cause: 400,
        });
    }

    const paymentWallet = await PaymentWallet.create({
        userId,
        liveCourseId:courseId,
        amount,
        paymentMethod,
        currency,
        type: "liveCourse",
        account: transferNumber || transferAccount,
        transactionImage: transactionImageUrl,
    });
    if(!paymentWallet) {
        return next({ message: "فشل الدفع", status: 400 });
    }

    return res.status(200).json({
        success: true,
        message: "تم ارسال طلب التسجيل في الدورة بنجاح",
        liveCourse,
    });

};

//& ====================== ENROLL LIVE COURSE BY CARD ====================== &//
export const enrollLiveCourseByCard = async (req, res, next) => {
    const { courseId } = req.params;
    const { id: userId } = req.authUser;
    const { amount, currency } = req.body;
    const liveCourse = await LiveCourse.findById(courseId);
    if (!liveCourse) return next({ message: "الدورة غير موجودة", status: 404 });

    const user = await User.findById(userId);
    if (!user) return next({ message: "User not found", cause: 404 });

    // Check if user is already enrolled
    const isEnrolled = liveCourse.enrolledUsers.includes(userId);
    if (isEnrolled) return next({ message: "أنت مسجل بالفعل في هذه الدورة", status: 400 });

    const chargeUrl = await createCharge({
        price: +amount,
        title: liveCourse.title,
        id: liveCourse._id,
        username: user.username,
        email: user.email,
        currency: currency,
        metadata: {
          userId,
          liveCourseId: liveCourse._id,
          currency,
          amount,
    
        },
        redirect: {
          url: `${process.env.CLIENT_URL}/profile`,
        },
        post: {
          url: `${process.env.SERVER_URL}/api/v1/live-course/webhook`,
        },
      });
      if (!chargeUrl) {
        return next({ message: "Failed to create charge", cause: 400 });
      }
        return res.status(200).json({
        success: true,
        status: "success",
        message: " Successfully created charge",
        chargeUrl
    });
};

//& ===================== HANDLE WEBHOOK FOR PAYMENT =====================
export const webhookHandler = async (req, res, next) => {
    const { metadata, status, id } = req.body;
    if (status === "CAPTURED") {
        const { userId, liveCourseId, currency, amount} = metadata;
        const options = {
            method: "GET",
            url: `${process.env.TAP_URL}/charges/${id}`,
            headers: {
            accept: "application/json",
            Authorization:  `Bearer ${process.env.TAP_SECRET_KEY}`,
            },
        };
        const response = await axios.request(options);
        if (response.data.status === "CAPTURED") {
            const liveCourse = await LiveCourse.findById(liveCourseId);
            if (!liveCourse) {
                return next({
                    cause: 400,
                    message: "فشل استرجاع الدورة",
                });
            }
            const isUserInCourse = liveCourse.enrolledUsers.some(user => user.toString() === userId.toString());   
            if (isUserInCourse) {
                return next({
                    message: "انت بالفعل مشترك في هذه الدورة",
                    cause: 400,
                });
            }

            liveCourse.enrolledUsers.push(userId);
            liveCourse.enrolledUsersCount++;
            await liveCourse.save();

            const paymentObject = {
                userId,
                account: "card",
                amount: amount,
                currency: currency,
                paymentMethod: "card",
                transactionImageUrl: null,
                type: "liveCourse",
                liveCourseId,
                status: "completed",
            };
            const paymentWallet = await PaymentWallet.create(paymentObject);
            if(!paymentWallet) {
                return next({ message: "فشل الدفع", status: 400 });
            }

            const user = await User.findById(userId);
            if (!user) {
                return next({ message: "User not found", cause: 404 });
            }
            const emailSubject = `تم التسجيل في الدورة`;
            const emailMessage = `تم التسجيل في الدورة ${liveCourse.title} بنجاح`;
            const isEmailSentClient = await sendEmailService({
                to: user.email,
                subject: emailSubject,
                message: emailMessage
            });
            if(!isEmailSentClient) {
                console.error('Email failed to send, but session was created');
            }
            return res.status(200).json({
                success: true,
                message: "Successfully enrolled in the live course",
                liveCourse,
            });
        }
        return next({
            message: "Payment not captured",
            cause: 400,
        });
    }
    return next({
        message: "Payment status is not captured",
        cause: 400,
    });
};
//& ====================== UNENROLL FROM LIVE COURSE ====================== &//
export const unenrollFromLiveCourse = async (req, res, next) => {
    const { id } = req.params;
    const userId = req.user._id; // Assuming user ID is stored in req.user

    if (!id) {
        return next({
            message: "Live course ID is required",
            cause: 400,
        });
    }

    try {
        const liveCourse = await LiveCourse.findById(id);
        if (!liveCourse) {
            return next({
                message: "Live course not found",
                cause: 404,
            });
        }

        if (!liveCourse.enrolledUsers.includes(userId)) {
            return next({
                message: "You are not enrolled in this live course",
                cause: 400,
            });
        }

        liveCourse.enrolledUsers = liveCourse.enrolledUsers.filter(user => user.toString() !== userId.toString());
        await liveCourse.save();

        return res.status(200).json({
            success: true,
            message: "Successfully unenrolled from the live course",
            liveCourse,
        });
    } catch (error) {
        return next({
            message: "Server error",
            cause: 500,
            error: error.message,
        });
    }
};
//& ====================== UPDATE LIVE COURSE ====================== &//
export const updateLiveCourse = async (req, res, next) => {
    const { id } = req.params;
    const { title, description, sessions, priceEGP, priceUSD } = req.body;

    if (!id) {
        return next({
            message: "Live course ID is required",
            cause: 400,
        });
    }

    try {
        const liveCourse = await LiveCourse.findById(id);
        if (!liveCourse) {
            return next({
                message: "Live course not found",
                cause: 404,
            });
        }

        liveCourse.title = title || liveCourse.title;
        liveCourse.description = description || liveCourse.description;

        if (sessions) {
            const parseSessions = JSON.parse(sessions);
            liveCourse.sessions = parseSessions.map(session => ({
                title: session.title,
                description: session.description,
                date: new Date(session.date),
                time: session.time,
                link: session.link || "",
            }));
        }

        if (req.files?.image) {
            liveCourse.image = `${process.env.SERVER_URL}/uploads/LiveCourses/${req.files.image[0].filename}`;
        }
        liveCourse.priceEGP = priceEGP || liveCourse.priceEGP;
        liveCourse.priceUSD = priceUSD || liveCourse.priceUSD;

        await liveCourse.save();

        return res.status(200).json({
            success: true,
            message: "Live course updated successfully",
            liveCourse,
        });
    } catch (error) {
        return next({
            message: "Server error",
            cause: 500,
            error: error.message,
        });
    }
};
//& ====================== DELETE LIVE COURSE ====================== &//
export const deleteLiveCourse = async (req, res, next) => {
    const { id } = req.params;

    if (!id) {
        return next({
            message: "Live course ID is required",
            cause: 400,
        });
    }

    try {
        const liveCourse = await LiveCourse.findByIdAndDelete(id);
        if (!liveCourse) {
            return next({
                message: "Live course not found",
                cause: 404,
            });
        }

        return res.status(200).json({
            success: true,
            message: "Live course deleted successfully",
        });
    } catch (error) {
        return next({
            message: "Server error",
            cause: 500,
            error: error.message,
        });
    }
};