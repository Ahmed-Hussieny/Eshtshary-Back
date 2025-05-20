import sendEmailService from "../../../services/send-email.services.js";

export const sendApprovalPaymentWallet = async ({
    user,
    therapist,
    sessions,
}) => {
    // Send email to Client
    const isEmailSentClient = await sendEmailService({
        to: user.email,
        subject: `تمت الموافقة على حجزتك`,
        message: `
            مرحبا ${user.username} ،\n
            تم الموافقة على حجزتك مع ${therapist.full_name} . \n
            تفاصيل الجلسة:
            ${sessions.map(
                (session) => `
                - تاريخ الجلسة: ${session.date} \n
                - وقت البدء: ${session.startTime} \n
                - وقت الانتهاء: ${session.endTime} \n
            `
            )}
        `,
    });
    if (!isEmailSentClient) {
        return {
            status: false,
            message: "فشل إرسال البريد الإلكتروني",
        };
    }
    // Send email to Therapist
    const isEmailSentTherapist = await sendEmailService({
        to: therapist.email,
        subject: `تم حجز جلسة جديدة`,
        message: `
            مرحبا ${therapist.full_name} ،\n
            تم حجز جلسة جديدة مع ${user.username} . \n
            تفاصيل الجلسة:
            ${sessions.map(
                (session) => `
                - تاريخ الجلسة: ${session.date} \n
                - وقت البدء: ${session.startTime} \n
                - وقت الانتهاء: ${session.endTime} \n
            `
            )}
        `,
    });
    if (!isEmailSentTherapist) {
        return {
            status: false,
            message: "فشل إرسال البريد الإلكتروني",
        };
    }
    return {
        status: true,
        message: "تم إرسال البريد الإلكتروني بنجاح",
    };
};

// Send Mail that the Payment Rejected
export const sendRejectPaymentWallet = async ({
    user,
    sessions,
}) => {
    // Send email to Client
    const isEmailSentClient = await sendEmailService({
        to: user.email,
        subject: `تم رفض حجزتك`,
        message: `
            مرحبا ${user.username} ،\n
            تم رفض حجزتك لان الدفع غير صحيح . \n
            تفاصيل الجلسة:
            ${sessions.map(
                (session) => `
                - تاريخ الجلسة: ${session.date} \n
                - وقت البدء: ${session.startTime} \n
                - وقت الانتهاء: ${session.endTime} \n
            `
            )}
        `,
    });
    if (!isEmailSentClient) {
        return {
            status: false,
            message: "فشل إرسال البريد الإلكتروني",
        };
    }
    return {
        status: true,
        message: "تم إرسال البريد الإلكتروني بنجاح",
    };
};

// Send Mail that the Payment Approved For Course
export const sendApprovalPaymentWalletForCourse = async ({paymentWallet}) => {
    // send email to Client
    const isEmailSentClient = await sendEmailService({
        to: paymentWallet.userId.email,
        subject: `تم الاشتراك في الدورة ${paymentWallet.courseId.title}`,
        message: `
            مرحبا ${paymentWallet.userId.username} ،\n
            تم الاشتراك في الدورة ${paymentWallet.courseId.title} بنجاح. \n
            تفاصيل الدورة:
            ${paymentWallet.courseId.description} \n
        `,
    });
    if (!isEmailSentClient) {
        return {
            status: false,
            message: "فشل إرسال البريد الإلكتروني",
        };
    }
    // send email to Therapist
    const isEmailSentTherapist = await sendEmailService({
        to: paymentWallet.therapistId.email,
        subject: `لديك اشتراك جديد في دوره ${paymentWallet.courseId.title}`,
        message: `
            مرحبا ${paymentWallet.therapistId.full_name} ،\n
            لديك اشتراك جديد في الدورة ${paymentWallet.courseId.title} . \n
            تفاصيل الدورة:
            ${paymentWallet.courseId.description} \n
        `,
    });
    if (!isEmailSentTherapist) {
        return {
            status: false,
            message: "فشل إرسال البريد الإلكتروني",
        };
    }
    return {
        status: true,
        message: "تم إرسال البريد الإلكتروني بنجاح",
    };
}

// Send Mail that the Payment Rejected For Course
export const sendRejectPaymentWalletForCourse = async ({paymentWallet}) => {
    // send email to Client
    const isEmailSentClient = await sendEmailService({
        to: paymentWallet.userId.email,
        subject: `تم رفض الاشتراك في الدورة ${paymentWallet.courseId.title}`,
        message: `
            مرحبا ${paymentWallet.userId.username} ،\n
            تم رفض الاشتراك في الدورة ${paymentWallet.courseId.title} . \n
            تفاصيل الدورة:
            ${paymentWallet.courseId.description} \n
        `,
    });
    if (!isEmailSentClient) {
        return {
            status: false,
            message: "فشل إرسال البريد الإلكتروني",
        };
    }
    return {
        status: true,
        message: "تم إرسال البريد الإلكتروني بنجاح",
    };
}

