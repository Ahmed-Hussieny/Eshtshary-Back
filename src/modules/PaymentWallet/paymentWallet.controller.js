import PaymentWallet from "../../../DB/Models/paymentWallet.model.js";
import Session from "../../../DB/Models/session.model.js";
import sendEmailService from "../../services/send-email.services.js";

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


//& ==================== get all paymentWallets =========================
export const getAllPaymentWallets = async (req, res, next) => {
    const paymentWallets = await PaymentWallet.find({
        status: "pending",
    }).populate("sessionId").populate("userId").populate("therapistId");
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
};

//& ==================== approve paymentWallet by id =========================
export const approvePaymentWallet = async (req, res, next) => {
    const { id } = req.params;
    const paymentWallet = await PaymentWallet.findById(id);
    if (!paymentWallet) {
        return next({
            cause: 400,
            message: "فشل تحديث محفظة الدفع",
        });
    }
    // console.log("session", paymentWallet);

    const session = await Session.findById(paymentWallet.sessionId).populate("userId").populate("therapistId");
    if (!session) {
        return next({
            cause: 400,
            message: "فشل استرجاع الجلسة",
        });
    }
    console.log("session", session);
    const isEmailSent1 = await sendEmailService({
            to: session.userId.email,
            subject: 'ADHD - Payment Approved',
            message: `
                Dear ${session.userId.username},
                Thank you for your payment.
                Your payment for the session on ${session.date} has been approved.
                Please check your session list for more details.
            `,
        });
        if(!isEmailSent1) return next({message: 'Email is not sent', cause: 500});
        const isEmailSent2 = await sendEmailService({
            to: session.therapistId.email,
            subject: 'New Session',
            message: `
                Dear ${session.therapistId.username},
                Congratulations!
                A new session has been created for you with the user ${session.userId.username} on ${session.date.toString().split('T')[0]} at ${session.startTime}.
                Please check your session list for more details.
            `,
        });
        if(!isEmailSent2) return next({message: 'Email is not sent', cause: 500});
        session.status = "scheduled";
        paymentWallet.status = "completed";
        await session.save();
        await paymentWallet.save();
    return res.status(200).json({
        message: "تم تحديث محفظة الدفع بنجاح",
        data: paymentWallet,
    });
};

//& ==================== reject paymentWallet by id =========================
export const rejectPaymentWallet = async (req, res, next) => {
    const { id } = req.params;
    const paymentWallet = await PaymentWallet.findById(id);
    if (!paymentWallet) {
        return next({
            cause: 400,
            message: "فشل تحديث محفظة الدفع",
        });
    }
    const deleteSession = await Session.findByIdAndDelete(paymentWallet.sessionId.toString());
    if (!deleteSession) {
        return next({
            cause: 400,
            message: "فشل حذف الجلسة",
        });
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
    const paymentWallets = await PaymentWallet.find({userId:_id,status:"pending"});
    console.log("id", paymentWallets);

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

//& ==================== get paymentWallet by courseId =========================
export const getPaymentWalletByCourseId = async (req, res, next) => {
    const { courseId } = req.params;
    const paymentWallets = await PaymentWallet.find({courseId}).populate("sessionId").populate("userId").populate("therapistId");
    if (!paymentWallets) {
        return next({
            cause: 400,
            message: "فشل استرجاع محفظة الدفع",
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




