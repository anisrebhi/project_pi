/**
 * @file utils/notificationService.js
 * @description Centralised notification dispatcher.
<<<<<<< HEAD
 * All automated emails (reservation confirmation, 24h reminder, event
 * modification, event cancellation) are triggered here so controllers
 * never import templates and sendMail directly.
=======
<<<<<<< HEAD
 * All automated emails (reservation confirmation, 24h reminder, event
 * modification, event cancellation) are triggered here so controllers
 * never import templates and sendMail directly.
=======
 * All automated emails (reservation confirmation, waitlist promotion, 24h
 * reminder, event modification, event cancellation) are triggered here so
 * controllers never import templates and sendMail directly.
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
 */
const { sendMail }  = require('./emailService');
const {
  buildReservationConfirmationEmail,
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
  buildWaitlistConfirmationEmail,
  buildWaitlistPromotionEmail,
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
  buildEventReminderEmail,
  buildEventModifiedEmail,
  buildEventCancelledEmail,
} = require('./emailTemplates');

/** Fire-and-forget helper: logs on failure, never throws. */
const fire = async (label, mailPromise) => {
  try {
    const result = await mailPromise;
    if (!result.sent) console.warn(`[Notify:${label}] Not sent — ${result.reason}`);
    return result;
  } catch (err) {
    console.error(`[Notify:${label}] Error — ${err.message}`);
    return { sent: false, reason: err.message };
  }
};

// ─── Confirmation de réservation ──────────────────────────────────────────────

const notifyReservationConfirmed = (reservation, event, user, qrCodeDataUrl) => {
  const mail = buildReservationConfirmationEmail({ reservation, event, user, qrCodeDataUrl });
  return fire('ReservationConfirmed', sendMail({ to: user.email, ...mail }));
};

<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
// ─── Inscription liste d'attente ──────────────────────────────────────────────

const notifyWaitlistJoined = (user, event, entry, position) => {
  const mail = buildWaitlistConfirmationEmail({ user, event, entry, position });
  return fire('WaitlistJoined', sendMail({ to: user.email, ...mail }));
};

// ─── Promotion depuis liste d'attente ─────────────────────────────────────────

const notifyWaitlistPromoted = (user, event, reservation) => {
  const mail = buildWaitlistPromotionEmail({ user, event, reservation });
  return fire('WaitlistPromoted', sendMail({ to: user.email, ...mail }));
};

>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
// ─── Rappel 24 h avant l'événement ────────────────────────────────────────────

const notifyEventReminder = (user, event, reservation) => {
  const mail = buildEventReminderEmail({ user, event, reservation });
  return fire('EventReminder', sendMail({ to: user.email, ...mail }));
};

// ─── Modification d'un événement ─────────────────────────────────────────────

const notifyEventModified = (user, event, changes) => {
  const mail = buildEventModifiedEmail({ user, event, changes });
  return fire('EventModified', sendMail({ to: user.email, ...mail }));
};

// ─── Annulation d'un événement ────────────────────────────────────────────────

const notifyEventCancelled = (user, event) => {
  const mail = buildEventCancelledEmail({ user, event });
  return fire('EventCancelled', sendMail({ to: user.email, ...mail }));
};

module.exports = {
  notifyReservationConfirmed,
<<<<<<< HEAD
=======
<<<<<<< HEAD
=======
  notifyWaitlistJoined,
  notifyWaitlistPromoted,
>>>>>>> aafeed99be36f3bc11bed1815dd9d32a585a85f3
>>>>>>> e2bbbb960cae30eff4e719238c6967919f724851
  notifyEventReminder,
  notifyEventModified,
  notifyEventCancelled,
};
