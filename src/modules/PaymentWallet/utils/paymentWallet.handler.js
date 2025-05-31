import sendEmailService from "../../../services/send-email.services.js";
import {
  acceptPaymentCourseTemplete,
  acceptPaymentLiveCourseTemplete,
  acceptPaymentSessionTemplate,
  acceptPaymentSessionTemplateTherapist,
  rejectPaymentCourseTemplate,
  rejectPaymentLiveCourseTemplate,
  rejectPaymentSessionTemplate,
} from "../../../utils/templates/payment.js";

export const sendApprovalPaymentWallet = async ({
  user,
  therapist,
  sessions,
}) => {
  // Send email to Client
  const isEmailSentClient = await sendEmailService({
    to: user.email,
    subject: `دفعك تم بنجاح – خلينا نبدأ!`,
    message: acceptPaymentSessionTemplate(
      user.username,
      therapist.full_name,
      sessions
    ),
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
    message: acceptPaymentSessionTemplateTherapist(
      therapist.full_name,
      user.username,
      sessions
    ),
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
export const sendRejectPaymentWallet = async ({ user, sessions }) => {
  // Send email to Client
  const isEmailSentClient = await sendEmailService({
    to: user.email,
    subject: `تم رفض حجز الجلسة`,
    message: rejectPaymentSessionTemplate(user.username, sessions),
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
export const sendApprovalPaymentWalletForCourse = async ({ paymentWallet }) => {
  // send email to Client
  const isEmailSentClient = await sendEmailService({
    to: paymentWallet.userId.email,
    subject: `تم الاشتراك في الدورة ${paymentWallet.courseId.title}`,
    message: acceptPaymentCourseTemplete(
      paymentWallet.userId.username,
      paymentWallet
    ),
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

// Send Mail that the Payment Rejected For Course
export const sendRejectPaymentWalletForCourse = async ({ paymentWallet }) => {
  // send email to Client
  const isEmailSentClient = await sendEmailService({
    to: paymentWallet.userId.email,
    subject: `تم رفض الاشتراك في الدورة ${paymentWallet.courseId.title}`,
    message: rejectPaymentCourseTemplate(
      paymentWallet.userId.username,
      paymentWallet
    ),
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

export const sendApprovalPaymentWalletForLiveCourse = async ({
  paymentWallet,
}) => {
  // send email to Client
  const isEmailSentClient = await sendEmailService({
    to: paymentWallet.userId.email,
    subject: `تم الاشتراك في الدورة ${paymentWallet.liveCourseId.title}`,
    message: acceptPaymentLiveCourseTemplete(
      paymentWallet.userId.username,
      paymentWallet
    ),
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

export const sendRejectPaymentWalletForLiveCourse = async ({ paymentWallet }) => {
  // send email to Client
  const isEmailSentClient = await sendEmailService({
    to: paymentWallet.userId.email,
    subject: `تم رفض الاشتراك في الدورة ${paymentWallet.liveCourseId.title}`,
    message: rejectPaymentLiveCourseTemplate(
      paymentWallet.userId.username,
      paymentWallet
    ),
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