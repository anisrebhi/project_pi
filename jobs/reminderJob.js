/**
 * @file jobs/reminderJob.js
 * @description Cron job — sends 24h reminder emails to registered participants.
 *              Runs every hour. Marks registrations as reminded to avoid duplicates.
 */

const cron = require("node-cron");
const Event = require("../models/Event");
const Registration = require("../models/Registration");
const { sendReminderEmail } = require("../services/emailService");

/**
 * Start the reminder cron job.
 * Call this once at app startup.
 */
const startReminderJob = () => {
  // Run every hour at minute 0
  cron.schedule("0 * * * *", async () => {
    console.log("[ReminderJob] Running 24h reminder check...");

    try {
      const now = new Date();
      const in23h = new Date(now.getTime() + 23 * 60 * 60 * 1000);
      const in25h = new Date(now.getTime() + 25 * 60 * 60 * 1000);

      // Find events happening in the next 23–25h window
      const upcomingEvents = await Event.find({
        date: { $gte: in23h, $lt: in25h },
        isActive: true,
      });

      if (upcomingEvents.length === 0) {
        console.log("[ReminderJob] No events in the 24h window.");
        return;
      }

      let sent = 0;
      let failed = 0;

      for (const event of upcomingEvents) {
        // Get registrations that haven't received a reminder yet
        const registrations = await Registration.find({
          eventId: event._id,
          qrUsed: false,
          reminderSent: false,
        }).populate("userId", "fullName email isActive");

        for (const reg of registrations) {
          if (!reg.userId || !reg.userId.isActive) continue;

          try {
            await sendReminderEmail(reg.userId, event);
            reg.reminderSent = true;
            await reg.save();
            sent++;
          } catch (emailError) {
            console.error(`[ReminderJob] Failed for ${reg.userId.email}:`, emailError.message);
            failed++;
          }
        }
      }

      console.log(`[ReminderJob] Done — ${sent} sent, ${failed} failed.`);
    } catch (err) {
      console.error("[ReminderJob] Fatal error:", err.message);
    }
  });

  console.log("Reminder cron job started (runs every hour)");
};

module.exports = { startReminderJob };
