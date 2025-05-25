import axios from "axios";
import Session from "../../../DB/Models/session.model.js";
import Therapist from "../../../DB/Models/therapist.model.js";
import User from "../../../DB/Models/user.model.js";
import { createCharge } from "../../services/tapPayment.js";
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

  const sessions = await createSessions(therapist, userId, requestedSlots, currency);
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

//& ================== CREATE SESSIONS USING PAYMENT CARD ==================
export const createSessionWithCard = async (req, res, next) => {
  const { therapistId, slots, amount, currency } = req.body;
  const { _id: userId } = req.authUser;
  // get the User from the database
  const user = await User.findById(userId);
  if (!user) {
    return next({ message: "User not found", cause: 404 });
  }
  // Parse the slots string into an array of objects
  let requestedSlots = JSON.parse(slots);

  const therapist = await Therapist.findById(therapistId);
  if (!therapist) {
    return next({ message: "Therapist not found", cause: 404 });
  }

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
  // Create charge using Tap Payment
  const chargeUrl = await createCharge({
    price: +amount,
    title: `Therapy Session with ${therapist.full_name}`,
    id: therapist._id,
    username: user.username,
    email: user.email,
    currency: currency,
    metadata: {
      userId,
      therapistId,
      requestedSlots: JSON.stringify(requestedSlots),
      currency,
      amount,

    },
    redirect: {
      url: `${process.env.CLIENT_URL}/profile`,
    },
    post: {
      url: `${process.env.SERVER_URL}/api/v1/session/webhook`,
    },
  });
  if (!chargeUrl) {
    return next({ message: "Failed to create charge", cause: 400 });
  }
  return res.status(201).json({
    success: true,
    message: "تم انشاء الجلسات بنجاح الرجاء الانتظار حتي يتم قبولها",
    chargeUrl,
  });
};

export const webhookHandler = async (req, res) => {
  const { metadata, status, id } = req.body;

  if (status === "CAPTURED") {
    const { userId, therapistId, requestedSlots, currency, amount } = metadata;

    try {
      // Verify payment status
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
        // Create sessions
        const sessions = await createSessions(
          await Therapist.findById(therapistId),
          userId,
          JSON.parse(requestedSlots),
          metadata.currency,
          true
        );

        if (!sessions || sessions.length === 0) {
          return res.status(400).json({ message: "No sessions created" });
        }

        // Handle payment
        const paymentObject = {
          userId,
          therapistId,
          amount: metadata.amount,
          currency: metadata.currency,
          paymentMethod: "card",
          transactionImageUrl: null,
          sessions,
          statusCompleted:true
        };

        const paymentWallet = await handelCreatePaymentWallet(paymentObject);
        if (!paymentWallet) {
          return res.status(400).json({ message: "Payment wallet not created" });
        }

        // Send emails
        const user = await User.findById(userId);
        const therapist = await Therapist.findById(therapistId);

        if (!user || !therapist) {
          return res.status(404).json({ message: "User or therapist not found" });
        }

        const isEmailSentClient = await sendEmailToUser(user, sessions, therapist);
        if (!isEmailSentClient.status) {
          return res.status(400).json({ message: isEmailSentClient.message });
        }
        if(currency === "EGP") {
            therapist.walletEgp += amount * Number(process.env.THERAPIST_RATE_SESSION);
        } else if(currency === "USD") {
            therapist.walletUsd += amount * Number(process.env.THERAPIST_RATE_SESSION);
        }
        await therapist.save();
        return res.status(200).json({
          message: "Payment verified, sessions created, and emails sent",
          sessions,
          paymentWallet
        });
      }
        
      return res.status(400).json({ message: "Payment not captured" });
    } catch (error) {
      return res.status(500).json({ message: "Error processing webhook" });
    }
  }

  return res.status(200).json({
    message: "Webhook received successfully",
    status
  });
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
  const { _id: therapistId } = req.authTherapist;
  console.log(therapistId);
  const sessions = await Session.find({ therapistId , 
    status: { $in: ["scheduled", "completed"] } })
    .populate("userId", "username email")
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

//& ================== MARK SESSION AS COMPLETED ==================
export const markSessionAsCompleted = async (req, res, next) => {
  const { sessionId } = req.params;
  const { _id: therapistId } = req.authTherapist;
  const { notes } = req.body;

  if (!sessionId) {
    return next({ message: "Session ID is required", cause: 400 });
  }

  const session = await Session.findById(
    sessionId
  );
  if (!session) {
    return next({ message: "Session not found", cause: 404 });
  }
  console.log("Session found:", session);
  // check if session data is today or past
  const currentDate = new Date();
  const sessionDate = new Date(session.date);
  
  if (sessionDate > currentDate) {
    console.log("Session date is in the future");
    return next({ message: "هذا التاريخ في المستقبل", cause: 400 });
  }
  session.status = "completed";
  session.notes = notes;
  await session.save();
  const therapist = await Therapist.findById(therapistId);
  if (!therapist) {
    return next({ message: "Therapist not found", cause: 404 });
  }
  therapist.numberOfSessions += 1;
  if(session.currency === "EGP") {
    therapist.walletEgp += session.amount * Number(process.env.THERAPIST_RATE_SESSION);
  } else if(session.currency === "USD") {
    therapist.walletUsd += session.amount * Number(process.env.THERAPIST_RATE_SESSION);
  }
  await therapist.save();
  // send mail to user to make rate

  return res.status(200).json({
    success: true,
    message: "تم انهاء الجلسة بنجاح",
    sessionId: session._id,
  });
};