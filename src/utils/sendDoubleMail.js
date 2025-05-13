import sendEmailService from "../services/send-email.services.js";

export const sendDoubleMail = async (email1, email2, subject, meetingLink) => {
    const isEmailSentClient = await sendEmailService({
        to: email1,
        subject: subject,
        message: meetingLink
    });
    if(!isEmailSentClient) return next({message: 'Email is not sent', cause: 500});

    const isEmailSentTherapist = await sendEmailService({
        to: email2,
        subject: subject,
        message: meetingLink
    });
    if(!isEmailSentTherapist) return next({message: 'Email is not sent', cause: 500});
    return { message: 'Email sent successfully' };
};