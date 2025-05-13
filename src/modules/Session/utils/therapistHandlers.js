import Session from "../../../../DB/Models/session.model.js";
import Therapist from "../../../../DB/Models/therapist.model.js";

export const isTherapistAvailable = async (
  therapistId,
  slotId,
  date,
  sessionId = null
) => {
  try {
    // Check therapist exists
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
      return {
        message: "Therapist not found",
        success: false
      };
    }

    // Find the slot in therapist's availability
    let foundSlot = null;
    let slotDay = null;
    
    // Search through all availability days and slots
    for (const dayAvailability of therapist.availability) {
      const slot = dayAvailability.slots.find(s => s._id.toString() === slotId);
      if (slot) {
        foundSlot = slot;
        slotDay = dayAvailability.day;
        break;
      }
    }

    if (!foundSlot) {
      return {
        message: "Slot not found for this therapist",
        success: false
      };
    }

    if (!foundSlot.isAvailable) {
      return {
        message: "This slot is not available",
        success: false
      };
    }

    // Extract slot times
    const startTime = foundSlot.from;
    const endTime = foundSlot.to;

    // Validate time format
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    if (!timeRegex.test(startTime) || !timeRegex.test(endTime)) {
      return {
        message: "Invalid time format in therapist's slot. Use HH:MM 24-hour format",
        success: false
      };
    }

    // Calculate duration
    const sessionStart = new Date(`1970-01-01T${startTime}`);
    const sessionEnd = new Date(`1970-01-01T${endTime}`);
    const duration = (sessionEnd - sessionStart) / 60000; // in minutes

    if (isNaN(duration) || duration <= 0) {
      return {
        message: "Invalid session duration in therapist's slot",
        success: false
      };
    }

    // Check for conflicting sessions (assuming date is not needed since slot is unique)
    const conflictConditions = {
      therapistId,
      slotId,
      date,
      status: { $ne: 'cancelled' } // assuming you don't want to count cancelled sessions
    };

    if (sessionId) {
      conflictConditions._id = { $ne: sessionId };
    }

    const conflict = await Session.findOne(conflictConditions);
    if (conflict) {
      return {
        message: "This slot is already booked",
        success: false
      };
    }

    return {
      success: true,
      message: "Therapist is available for this slot",
      duration,
      therapistId,
      slotId,
      slotDay,
      startTime,
      endTime
    };

  } catch (error) {
    console.error("Error checking therapist availability:", error);
    return {
      success: false,
      message: "Error checking availability"
    };
  }
};