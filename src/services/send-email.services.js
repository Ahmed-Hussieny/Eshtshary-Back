import nodemailer from "nodemailer";
const sendEmailService = async ({
  to = "",
  subject = "no-reply",
  message = "no message",
  attachments = [],
}) => {

  const transporter = nodemailer.createTransport({
  host: 'smtp.titan.email', // Titan's SMTP server
  port: 465, // SSL (or 587 for TLS)
  secure: true, // true for 465, false for other ports
    auth: {
      user: "info@arabadhd.com",
      pass: "ArabADHDpr2#",
    },
  });

  const info = await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html: message,
    attachments,
  });
  return info.accepted.length ? true : false;
};

export default sendEmailService;