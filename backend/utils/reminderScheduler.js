/**
 * @file utils/reminderScheduler.js
 * @description Automated 24-hour-before-event reminder system.
 *
 * Runs a lightweight interval (every 5 minutes by default) that queries for
 * reservations whose event starts between 23h and 25h from now and have not
 * yet received a reminder. No external cron library is required.
 *
 * Start with: require('./utils/reminderScheduler').start()
 */
const Reservation  = require('../models/Reservation');
const { notifyEventReminder } = require('./notificationService');

let intervalHandle = null;
const CHECK_INTERVAL_MS   = 5  * 60 * 1000; // check every 5 minutes
const REMINDER_WINDOW_LOW = 23 * 60 * 60 * 1000; // 23 h in ms
const REMINDER_WINDOW_HIGH= 25 * 60 * 60 * 1000; // 25 h in ms

const runReminderCheck = async () => {
  const now = Date.now();
  const windowStart = new Date(now + REMINDER_WINDOW_LOW);
  const windowEnd   = new Date(now + REMINDER_WINDOW_HIGH);

  try {
    const reservations = await Reservation.find({
      status: 'confirmed',
      reminderSentAt: { $exists: false }, // field added below
    })
      .populate({ path: 'event',  match: { startDate: { $gte: windowStart, $lte: windowEnd } }, select: 'title startDate endDate location' })
      .populate('user', 'fullName email');

    // Mongoose populate with `match` keeps the doc but sets event=null when
    // the event doesn't match the filter — we filter those out here.
    const due = reservations.filter((r) => r.event !== null && r.user !== null);

    if (due.length > 0) {
      console.log(`[Reminder] ${due.length} reminder(s) to send...`);
    }

    await Promise.all(
      due.map(async (r) => {
        try {
          await notifyEventReminder(r.user, r.event, r);
          // Mark as sent so we never send twice
          r.reminderSentAt = new Date();
          await r.save();
        } catch (err) {
          console.error(`[Reminder] Failed for reservation ${r._id}:`, err.message);
        }
      })
    );
  } catch (err) {
    console.error('[Reminder] Scheduler error:', err.message);
  }
};

const start = () => {
  if (intervalHandle) return; // already running
  console.log('[Reminder] 24-hour reminder scheduler started (interval: 5 min).');
  // Run once immediately on startup, then on interval
  runReminderCheck();
  intervalHandle = setInterval(runReminderCheck, CHECK_INTERVAL_MS);
};

const stop = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[Reminder] Scheduler stopped.');
  }
};

module.exports = { start, stop };
