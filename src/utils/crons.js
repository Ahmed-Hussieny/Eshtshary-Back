import { scheduleJob } from "node-schedule";
import moment from "moment";
import Session from "../../DB/Models/session.model.js";
import sendEmailService from "../services/send-email.services.js";
import ZoomService from "../services/zoom.js";

export async function cronToCheckSubscription() {
  const zoom = new ZoomService();
    console.log('🔔 Setting up session reminder job...');

  //~ Runs every hour at minute 0
  scheduleJob("* * * * *", async () => {
    console.log("Checking sessions...");
    const now = moment();

    const sessions = await Session.find({
      status: "scheduled",
      meetingLink: "",
    })
      .populate("therapistId", "name email")
      .populate("userId", "name email");
    console.log("Sessions found:", sessions);
    sessions.forEach(async (session) => {
      const [startHour, startMinute] = session.startTime.split(":").map(Number);

      const sessionDateTime = moment(session.date).set({
        hour: startHour,
        minute: startMinute,
        second: 0,
        millisecond: 0,
      });

      const diffInMinutes = sessionDateTime.diff(now, "minutes");
      console.log("Difference in minutes:", diffInMinutes);
      // ~24 hours = 1440 minutes ± 30 (to cover full hour)
      if (diffInMinutes >= 1410 && diffInMinutes <= 1470) {
        console.log(`🔔 Session starts in ~24 hours for user: ${session.userId.email}`);
        // TODO: send 24-hour reminder email/notification
        const isEmailSentClient = await sendEmailService({
            to: session.userId.email,
            subject: "Session Reminder - 24 hours",
            message: `Your session with ${session.therapistId.name} is scheduled for tomorrow at ${session.startTime}.`
        });
        if(!isEmailSentClient) return next({message: 'Email is not sent', cause: 500});
        
        // send email to therapist
        const isEmailSentTherapist = await sendEmailService({
            to: session.therapistId.email,
            subject: "Session Reminder - 24 hours",
            message: `You have a session with ${session.userId.name} scheduled for tomorrow at ${session.startTime}.`
        });
        if(!isEmailSentTherapist) return next({message: 'Email is not sent', cause: 500});
      }

      // ~1 hour = 60 minutes ± 30 (to cover full hour)
      if (diffInMinutes >= 0 && diffInMinutes <= 90) {
        console.log(`⏰ Session starts in ~1 hour for user: ${session.userId.email}`);
        // TODO: send 1-hour reminder email/notification

        
          const result = await zoom.createMeeting({
            topic: `Therapy Session with ${session.therapistId.name} for ${session.userId.name}`,
            type: 2,
            start_time: new Date(session.date).toISOString(),
            duration: session.duration,
            timezone: "UTC",
            agenda: `Therapy Session with ${session.therapistId.name} for ${session.userId.name}`,
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
        const isEmailSentClient = await sendEmailService({
            to: session.userId.email,
            subject: emailSubject,
            message: emailMessage
        });
        if(!isEmailSentClient) return next({message: 'Email is not sent', cause: 500});
        // send email to therapist
        const isEmailSentTherapist = await sendEmailService({
            to: session.therapistId.email,
            subject: emailSubject,
            message: emailMessage
        });
        if(!isEmailSentTherapist) return next({message: 'Email is not sent', cause: 500});

      }
    });
  });
}
