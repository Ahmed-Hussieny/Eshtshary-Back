import PaymentWallet from "../../../../DB/Models/paymentWallet.model.js";
import Session from "../../../../DB/Models/session.model.js";
import Therapist from "../../../../DB/Models/therapist.model.js";
import sendEmailService from "../../../services/send-email.services.js";

export const isTherapistExist = async (therapistId) => {
    const therapist = await Therapist.findById(therapistId);
    if (!therapist) {
        return {
            status: false,
            message: "therapist not found",
        }
    }
    return therapist;
};

export const isRequestedSlotsAvailable = async (therapist, requestedSlots) => {
    for (const requestedSlot of requestedSlots) {
        const slotDate = new Date(requestedSlot.date);
        const dayName = slotDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dayAvailability = therapist.availability.find(avail => avail.day === dayName);
        if (!dayAvailability) {
            return {status: false,message: `هذا اليوم ${dayName} غير متاح`}
        }

        const therapistSlot = dayAvailability.slots.find(slot => 
        slot._id.toString() === requestedSlot.slotId
        );

        if (!therapistSlot) {
            return {status: false,message: `هذا الوقت ${requestedSlot.timeFrom} غير متاح`}
        }

        if(therapistSlot.datesBooked && therapistSlot.datesBooked.some(date => 
        new Date(date).toDateString() === slotDate.toDateString()
        )) {
            return {status: false,message: `هذا الوقت ${requestedSlot.timeFrom} محجوز مسبقًا`}
        }
    }    
    return {status: true,message: "therapist is available"}
}

export const createSessions = async (therapist, userId, requestedSlots, currency) => {
    const sessions = [];
    for (const requestedSlot of requestedSlots) {
        const slotDate = new Date(requestedSlot.date);
        const dayName = slotDate.toLocaleDateString('en-US', { weekday: 'long' });
        const dayAvailability = therapist.availability.find(avail => avail.day === dayName);
        const therapistSlot = dayAvailability.slots.find(slot => 
          slot._id.toString() === requestedSlot.slotId
        );
        let amount = 0;
        if (currency === "EGP") {
            if(therapistSlot.duration === 30) {
                amount = therapist.prices.eg30;
            }
            else if(therapistSlot.duration === 60) {
                amount = therapist.prices.eg60;
            }
            else if(therapistSlot.duration === 90) {
                amount = therapist.prices.eg90;
            }
            
        } else if (currency === "USD") {
            if(therapistSlot.duration === 30) {
                amount = therapist.prices.usd30;
            }
            else if(therapistSlot.duration === 60) {
                amount = therapist.prices.usd60;
            }
            else if(therapistSlot.duration === 90) {
                amount = therapist.prices.usd90;
            }
        }
        // Create a new session
        const newSession = await Session.create({
            therapistId: therapist._id,
            userId,
            slotId: therapistSlot._id,
            date: slotDate,
            amount,
            currency,
            startTime: therapistSlot.from,
            endTime: therapistSlot.to,
            duration: therapistSlot.duration,
            status: "pending",
            notes: "",
            meetingLink: "",
        });

        // Update the therapist's availability
        therapistSlot.datesBooked.push(requestedSlot.date);
        therapistSlot.bookedBy.push(userId);
        await therapist.save();

        sessions.push(newSession);
    }
    return sessions;
};

export const handelCreatePaymentWallet = async (paymentObject) => {
    let paymentWallet;
    if (["vodafoneCash", "instaPay"].includes(paymentObject.paymentMethod)) {
        paymentWallet = await PaymentWallet.create({
            sessionId: paymentObject.sessions.map(session => session._id),
            userId : paymentObject.userId,
            therapistId: paymentObject.therapistId,
            account: paymentObject.transferNumber || paymentObject.transferAccount,
            amount: paymentObject.amount,
            paymentMethod: paymentObject.paymentMethod,
            status: "pending",
            currency : paymentObject.currency,
            type: "session",
            transactionImage: paymentObject.transactionImageUrl, 
        });
    }
    return paymentWallet;
}
export const sendEmailToUser = async (user, sessions, therapist) => {
    const emailSubject = `New Session Created`;
    const emailMessage = `Your therapy session is under review. Here are the details: ${sessions.map(session => `
        Session ID: ${session._id}
        Therapist: ${therapist.full_name}
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
        return {
            status: false,
            message: "Email failed to send, but session was created"
        }
    }
    return {
        status: true,
        message: "Email sent successfully"
    }
}
export const sendEmailToTherapist = async (therapist, sessions) => {
    const emailSubject = `New Session Created`;
    const emailMessage = `You have a new therapy session. Here are the details: ${sessions.map(session => `
        Session ID: ${session._id}
        User: ${user.name}
        Date: ${session.date}
        Start Time: ${session.startTime}
        End Time: ${session.endTime}
    `).join("\n")}`;

    const isEmailSentTherapist = await sendEmailService({
        to: therapist.email,
        subject: emailSubject,
        message: emailMessage
    });
    
    if(!isEmailSentTherapist) {
        return {
            status: false,
            message: "Email failed to send, but session was created"
        }
    }
    return {
        status: true,
        message: "Email sent successfully"
    }
}