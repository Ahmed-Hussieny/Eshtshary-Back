import { scheduleJob } from "node-schedule";
import moment from "moment-timezone";
import Session from "../../DB/Models/session.model.js";
import sendEmailService from "../services/send-email.services.js";
import ZoomService from "../services/zoom.js";
import LiveCourse from "../../DB/Models/liveCourse.model.js";
import User from "../../DB/Models/user.model.js";
import {
  reminder1SessionTemplate,
  reminder1SessionTemplateTherapist,
  reminder24SessionTemplate,
  reminder24SessionTemplateTherapist,
} from "./templates/remiderSession.js";

export async function cronToCheckSubscription() {
  try {
    const zoom = new ZoomService();
    console.log("🔔 Setting up session reminder job...");

    //~ Runs every hour at minute 0
    scheduleJob("* * * * *", async () => {
      console.log("Checking sessions...");
      const now = moment().tz("Africa/Cairo");

      const sessions = await Session.find({
        status: "scheduled",
        meetingLink: "",
      })
        .populate("therapistId", "full_name email")
        .populate("userId", "username email");

      const liveCourses = await LiveCourse.aggregate([
        {
          $project: {
            title: 1,
            description: 1,
            sessions: {
              $filter: {
                input: "$sessions",
                as: "session",
                cond: {
                  $and: [
                    { $eq: ["$$session.link", ""] },
                    {
                      $or: [
                        { $eq: ["$$session.is24HourReminderSent", false] },
                        { $eq: ["$$session.is1HourReminderSent", false] },
                      ],
                    },
                  ],
                },
              },
            },
          },
        },
        // Optionally remove courses with no matching sessions
        {
          $match: {
            sessions: { $ne: [] },
          },
        },
      ]);

      liveCourses.forEach(async (course) => {
        course.sessions.forEach(async (session) => {
          const [startHour, startMinute] = session.time.split(":").map(Number);

          const sessionDateTime = moment(session.date).tz("Africa/Cairo").set({
            hour: startHour,
            minute: startMinute,
            second: 0,
            millisecond: 0,
          });

          const diffInMinutes = sessionDateTime.diff(now, "minutes");
          console.log("Difference in minutes:", diffInMinutes);
          // ~24 hours = 1440 minutes ± 30 (to cover full hour)
          if (diffInMinutes >= 1410 && diffInMinutes <= 1470) {
            // console.log( `🔔 Session starts in ~24 hours for user: ${session.userId.email}` );
            if (session.is24HourReminderSent === false) {
              const usersIds = course.enrolledUsers.map((user) => user);
              for (const userId of usersIds) {
                const user = await User.findById(userId);
                if (!user) continue;

                const isEmailSentClient = await sendEmailService({
                  to: user.email,
                  subject: "🚨 Session Reminder - 24 hours",
                  message: `
                  <h1>Session Reminder</h1>
                  <p>Dear ${user.username},</p>
                  <p>This is a reminder that you have a session in live Course ${course.title} scheduled tomorrow at ${session.time}.</p>
                  <p>Thank you!</p>
                  <p>Best regards,</p>
                `,
                });
                if (!isEmailSentClient)
                  return next({ message: "Email is not sent", cause: 500 });
              }
              // update session reminder status
              await LiveCourse.updateOne(
                { _id: course._id, "sessions._id": session._id },
                { $set: { "sessions.$.is24HourReminderSent": true } }
              );
              console.log("24-hour reminder email sent successfully.");
            }
          }
          // ~1 hour = 60 minutes ± 30 (to cover full hour)
          if (diffInMinutes >= 30 && diffInMinutes <= 90) {
            console.log(`⏰ Session starts in ~1 hour for user: ${session}`);
            if (session.is1HourReminderSent === false) {
              const usersIds = course.enrolledUsers?.map((user) => user);
              const result = await zoom.createMeeting({
                topic: `Therapy Session in Live Course ${course.title}`,
                type: 2,
                start_time: new Date(session.date).toISOString(),
                duration: 60,
                timezone: "UTC",
                agenda: `Therapy Session in Live Course ${course.title}`,
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
              for (const userId of usersIds) {
                const user = await User.findById(userId);
                if (!user) continue;

                const isEmailSentClient = await sendEmailService({
                  to: user.email,
                  subject: "⏰ Session Reminder - 1 hour",
                  message: `
                  <h1>Session Reminder</h1>
                  <p>Dear ${user.username},</p>
                  <p>This is a reminder that you have a session in live Course ${course.title} scheduled in 1 hour at ${session.time}.</p>
                  <p> please go Forward to the following link of meeting:</p>
                  <p><a href="${result.joinUrl}">Join Session</a></p>
                  <p>Thank you!</p>
                  <p>Best regards,</p>
                `,
                });
                if (!isEmailSentClient)
                  return next({ message: "Email is not sent", cause: 500 });
              }
              // update session reminder status
              await LiveCourse.updateOne(
                { _id: course._id, "sessions._id": session._id },
                {
                  $set: {
                    "sessions.$.is1HourReminderSent": true,
                    "sessions.$.link": result.joinUrl,
                  },
                }
              );
            }
          }
        });
      });

      sessions.forEach(async (session) => {
        const [startHour, startMinute] = session.startTime
          .split(":")
          .map(Number);

        const sessionDateTime = moment(session.date).tz("Africa/Cairo").set({
          hour: startHour,
          minute: startMinute,
          second: 0,
          millisecond: 0,
        });

        const diffInMinutes = sessionDateTime.diff(now, "minutes");
        console.log("Difference in minutes:", diffInMinutes);
        // ~24 hours = 1440 minutes ± 30 (to cover full hour)
        if (diffInMinutes >= 1410 && diffInMinutes <= 1470) {
          console.log(
            `🔔 Session starts in ~24 hours for user: ${session.userId.email}`
          );
          if (session.is24HourReminderSent === false) {
            // TODO: send 24-hour reminder email/notification
            const isEmailSentClient = await sendEmailService({
              to: session.userId.email,
              subject: "تذكير بالجلسة بتاعتك غدا ⏰",
              message: reminder24SessionTemplate(
                session.userId.username,
                session.therapistId.full_name,
                session.startTime,
                `${process.env.CLIENT_URL}/session-questions/${session._id}`
              ),
            });
            if (!isEmailSentClient)
              return next({ message: "Email is not sent", cause: 500 });

            // send email to therapist
            const isEmailSentTherapist = await sendEmailService({
              to: session.therapistId.email,
              subject: "⏰ تذكير بجلسة غدًا",
              message: reminder24SessionTemplateTherapist(
                session.therapistId.full_name,
                session.userId.username,
                session.startTime
              ),
            });
            if (!isEmailSentTherapist)
              return next({ message: "Email is not sent", cause: 500 });

            await Session.updateOne(
              { _id: session._id },
              { is24HourReminderSent: true }
            );
            console.log("24-hour reminder email sent successfully.");
            // session.reminder24HoursSent = true;
            // await session.save();
          }
        }

        // ~1 hour = 60 minutes ± 30 (to cover full hour)
        if (diffInMinutes >= 0 && diffInMinutes <= 90) {
          console.log(
            `⏰ Session starts in ~1 hour for user: ${session.userId.email}`
          );
          if (session.is1HourReminderSent === false) {
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

            const isEmailSentClient = await sendEmailService({
              to: session.userId.email,
              subject: `فاضل ساعة! جهّز نفسك`,
              message: reminder1SessionTemplate(
                session.userId.username,
                session.therapistId.full_name,
                session.startTime,
                `${result.joinUrl}`
              ),
            });
            if (!isEmailSentClient)
              return next({ message: "Email is not sent", cause: 500 });
            // send email to therapist
            const isEmailSentTherapist = await sendEmailService({
              to: session.therapistId.email,
              subject: "بعد ساعة عندك موعد جميل",
              message: reminder1SessionTemplateTherapist(
                session.therapistId.full_name,
                session.userId.username,
                session.startTime,
                `${result.joinUrl}`
              ),
            });
            if (!isEmailSentTherapist)
              return next({ message: "Email is not sent", cause: 500 });

            await Session.updateOne(
              { _id: session._id },
              { is1HourReminderSent: true }
            );
            console.log("1-hour reminder email sent successfully.");
          }
        }
      });
    });
  } catch (error) {
    console.error("Error in cronToCheckSubscription:", error);
  }
}
