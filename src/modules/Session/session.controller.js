import mongoose from "mongoose";
import PaymentWallet from "../../../DB/Models/paymentWallet.model.js";
import Session from "../../../DB/Models/session.model.js";
import Therapist from "../../../DB/Models/therapist.model.js";
import User from "../../../DB/Models/user.model.js";
import PaymobService from "../../services/paymob.js";
import ZoomService from "../../services/zoom.js";
import { sendDoubleMail } from "../../utils/sendDoubleMail.js";
import { isTherapistAvailable } from "./utils/therapistHandlers.js";
import sendEmailService from "../../services/send-email.services.js";

//& ================== CREATE SESSION ==================
export const createSession = async (req, res, next) => {
  try {
    const { therapistId, slots, paymentMethod, amount, currency, transferNumber } = req.body;
    console.log("req.body", req.body);
    const { _id: userId } = req.authUser;

    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return next({ message: "Therapist not found", cause: 404 });
    }

    // Parse the slots string into an array of objects
    let requestedSlots;
    try {
      requestedSlots = JSON.parse(slots);
    } catch (error) {
      console.log(error)
      return next({ message: "Invalid slots format", cause: 400 });
    }

    // Check all slots first before creating any sessions
    for (const requestedSlot of requestedSlots) {
      const slotDate = new Date(requestedSlot.date);
      const dayName = slotDate.toLocaleDateString('en-US', { weekday: 'long' });
        console.log("dayName", dayName)
      const dayAvailability = therapist.availability.find(avail => avail.day === dayName);
      if (!dayAvailability) {
        console.log("dayAvailability")
        return next({ 
          message: `Therapist is not available on ${dayName}`, 
          cause: 400 
        });
      }
      console.log("dayAvailability", dayAvailability)
      const therapistSlot = dayAvailability.slots.find(slot => 
        slot._id.toString() === requestedSlot.slotId
      );
      
      if (!therapistSlot) {
        console.log("therapistSlot")

        return next({ 
          message: `Slot not found in therapist's availability`, 
          cause: 400 
        });
      }

      if (!therapistSlot.isAvailable) {
        console.log("therapistSlot.isAvailable")
        return next({ 
          message: `Slot at ${requestedSlot.timeFrom} on ${requestedSlot.date} is not available`, 
          cause: 400 
        });
      }

      if (therapistSlot.datesBooked && therapistSlot.datesBooked.some(date => 
        new Date(date).toDateString() === slotDate.toDateString()
      )) {
        console.log("requestedSlot")

        return next({ 
          message: `Slot at ${requestedSlot.timeFrom} on ${requestedSlot.date} is already booked`, 
          cause: 400 
        });
      }
    }
    try {
      const sessions = [];
      
      for (const requestedSlot of requestedSlots) {
        const slotDate = new Date(requestedSlot.date);
        const dayName = slotDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dayAvailability = therapist.availability.find(avail => avail.day === dayName);
        const therapistSlot = dayAvailability.slots.find(slot => 
          slot._id.toString() === requestedSlot.slotId
        );
        console.log("therapistSlot", therapistSlot)

        // Create a new session
        const newSession = await Session.create({
          therapistId,
          userId,
          slotId: therapistSlot._id,
          date: slotDate,
          startTime: therapistSlot.from,
          endTime: therapistSlot.to,
          duration: therapistSlot.duration,
          status: "pending",
          notes: "",
          meetingLink: "",
        });

        // Update the therapist's availability
        therapistSlot.datesBooked.push(requestedSlot.date);
        await therapist.save();

        sessions.push(newSession);
      }

      // Handle payment
      let paymentWallet;
      if (["vodafoneCash", "instapay"].includes(paymentMethod)) {
        paymentWallet = await PaymentWallet.create({
          sessionId: sessions.map(session => session._id),
          userId,
          therapistId,
          account: transferNumber,
          amount,
          paymentMethod,
          status: "pending",
          currency,
        });
      }

      if (!paymentWallet) {
        throw new Error("Payment failed");
      }
console.log("paymentWallet", paymentWallet)
      // Commit the transaction

      // Send email to both therapist and user
      const user = await User.findById(userId);
      console.log("user", user)
      const emailSubject = `New Session Created`;
      const emailMessage = `Your therapy session is under review. Here are the details: ${sessions.map(session => `
        Session ID: ${session._id}
        Therapist: ${therapist.name}
        Date: ${session.date}
        Start Time: ${session.startTime}
        End Time: ${session.endTime}
      `).join("\n")}`;

      const isEmailSentClient = await sendEmailService({
        to: user.email,
        subject: emailSubject,
        message: emailMessage
      });
      
      if(!isEmailSentClient) {
        console.error('Email failed to send, but session was created');
      }

      return res.status(201).json({
        message: "Session created successfully",
        sessions,
        paymentWallet: paymentWallet[0]
      });

    } catch (error) {
      console.log(error)
      throw error;
    }

  } catch (error) {
    console.error("Error creating session:", error);
    return next({
      cause: 500,
      message: "Internal server error",
      error: error.message
    });
  }
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
  console.log("session", session);
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
