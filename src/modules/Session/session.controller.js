import Session from "../../../DB/Models/session.model.js";
import Therapist from "../../../DB/Models/therapist.model.js";
import User from "../../../DB/Models/user.model.js";
import ZoomService from "../../services/zoom.js";
import { sendDoubleMail } from "../../utils/sendDoubleMail.js";
import { createSessions, handelCreatePaymentWallet, isRequestedSlotsAvailable, sendEmailToUser } from "./utils/session.handler.js";

//& ================== CREATE SESSION ==================
export const createSession = async (req, res, next) => {
  const {
    therapistId,
    slots,
    paymentMethod,
    amount,
    currency,
    transferNumber,
    transferAccount,
  } = req.body;
  const { _id: userId } = req.authUser;

  // transactionImage
  const transactionImage = req.files.transactionImage[0].path;
  if (!transactionImage) {
    return next({ message: "الرجاء اضافه صوره التحويل", cause: 400 });
  }
  const transactionImageUrl = `${process.env.SERVER_URL}/uploads${
    req.files.transactionImage[0].path.split("/uploads")[1]
  }`;

  const therapist = await Therapist.findById(therapistId);
  if (!therapist) {
    return next({ message: "Therapist not found", cause: 404 });
  }

  // Parse the slots string into an array of objects
  let requestedSlots = JSON.parse(slots);

  // Check all slots first before creating any sessions
  const isSlotsAvailable = await isRequestedSlotsAvailable(
    therapist,
    requestedSlots
  );
  if (!isSlotsAvailable.status) {
    return next({
      message: isSlotsAvailable.message,
      cause: 400,
    });
  }

  const sessions = await createSessions(therapist, userId, requestedSlots);
  if (!sessions || sessions.length === 0) {
    return next({ message: "No sessions created", cause: 400 });
  }

  // Handle payment
  const paymentObject = {
    userId,
    therapistId,
    amount,
    currency,
    paymentMethod,
    transferNumber,
    transferAccount,
    transactionImageUrl,
    sessions,
  };
  let paymentWallet = await handelCreatePaymentWallet(paymentObject);
  if (!paymentWallet) {
    return next({ message: "Payment wallet not created", cause: 400 });
  }

  // Send email to both therapist and user
  const user = await User.findById(userId);
  if (!user) {
    return next({ message: "User not found", cause: 404 });
  }

  const isEmailSentClient = await sendEmailToUser(user, sessions, therapist);

  if (!isEmailSentClient.status) {
    return next({
      message: isEmailSentClient.message,
      cause: 400,
    });
  }

  return res.status(201).json({
    success: true,
    message: "تم انشاء الجلسات بنجاح الرجاء الانتظار حتي يتم قبولها",
  });
};

//& ================== CREATE ZOOM MEETING ==================
export const createZoomMeeting = async (req, res, next) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return next({ message: "Session ID is required", cause: 400 });
  }

  const session = await Session.findById(sessionId).populate(
    "therapistId userId"
  );
  if (!session) {
    return next({ message: "Session not found", cause: 404 });
  }
  const zoom = new ZoomService();
  const result = await zoom.createMeeting({
    topic: `Therapy Session with ${session.therapistId.name}`,
    type: 2,
    start_time: new Date(session.date).toISOString(),
    duration: 30,
    timezone: "UTC",
    agenda: "Therapy Session",
    settings: {
      host_video: true,
      participant_video: true,
      mute_upon_entry: false,
      waiting_room: true,
      join_before_host: true,
      auto_recording: "cloud",
    },
  });

  console.log("Meeting created successfully:", result.joinUrl);
  session.meetingLink = result.joinUrl;
  await session.save();

  const emailSubject = `Zoom Meeting Link for Your Therapy Session`;
  const emailMessage = `Your therapy session is scheduled. Here is the link to join the meeting: ${result.joinUrl}`;

  await sendDoubleMail(
    session.userId.email,
    session.therapistId.email,
    emailSubject,
    emailMessage
  );

  return res.status(200).json({
    message: "Zoom meeting created successfully",
    meetingLink: result.joinUrl,
  });
  // try {
  //   const meeting = await zoomService.createMeeting(meetingData);

  //   // Send email to both therapist and user

  // } catch (error) {
  //   return next({ message: error.message, cause: error.status || 500 });
  // }
};

//& ================== GET USER SESSIONS ==================
export const getUserSessions = async (req, res, next) => {
  const { _id: userId } = req.authUser;

  const sessions = await Session.find({ userId })
    .populate("therapistId", "name email")
    .sort({ date: -1 });

  if (!sessions || sessions.length === 0) {
    return next({ message: "No sessions found", cause: 404 });
  }

  return res.status(200).json({
    message: "Sessions retrieved successfully",
    sessions,
  });
};

//& ================== GET THERAPIST SESSIONS ==================
export const getTherapistSessions = async (req, res, next) => {
  const { _id: therapistId } = req.authUser;

  const sessions = await Session.find({ therapistId })
    .populate("userId", "name email")
    .sort({ date: -1 });

  if (!sessions || sessions.length === 0) {
    return next({ message: "No sessions found", cause: 404 });
  }

  return res.status(200).json({
    message: "Sessions retrieved successfully",
    sessions,
  });
};

//& ================== GET SESSION BY ID ==================
export const getSessionById = async (req, res, next) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return next({ message: "Session ID is required", cause: 400 });
  }

  const session = await Session.findById(sessionId)
    .populate("therapistId", "name email")
    .populate("userId", "name email");

  if (!session) {
    return next({ message: "Session not found", cause: 404 });
  }

  return res.status(200).json({
    message: "Session retrieved successfully",
    session,
  });
};

//& ================== UPDATE SESSION ==================
export const updateSession = async (req, res, next) => {
  const { sessionId } = req.params;
  const { status, notes } = req.body;

  if (!sessionId) {
    return next({ message: "Session ID is required", cause: 400 });
  }

  const session = await Session.findByIdAndUpdate(
    sessionId,
    { status, notes },
    { new: true }
  );

  if (!session) {
    return next({ message: "Session not found", cause: 404 });
  }

  return res.status(200).json({
    message: "Session updated successfully",
    session,
  });
};
//& ================== DELETE SESSION ==================
export const deleteSession = async (req, res, next) => {
  const { sessionId } = req.params;

  if (!sessionId) {
    return next({ message: "Session ID is required", cause: 400 });
  }

  const session = await Session.findByIdAndDelete(sessionId);

  if (!session) {
    return next({ message: "Session not found", cause: 404 });
  }

  return res.status(200).json({
    message: "Session deleted successfully",
    session,
  });
};
