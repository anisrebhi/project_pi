/**
 * @file utils/waitlistService.js
 * @description Core waitlist promotion logic.
 *
 * Triggered automatically when a reservation is cancelled.  The first
 * eligible waiting entry for the freed event is promoted to a confirmed
 * reservation and the user is notified.
 *
 * Returns the newly created reservation, or null if the waitlist is empty /
 * no suitable entry was found.
 */
const WaitlistEntry = require('../models/WaitlistEntry');
const Reservation   = require('../models/Reservation');
const Event         = require('../models/Event');
const { User }      = require('../models/User');
const { generateReservationQRCode } = require('./qrCodeHelper');
const { notifyWaitlistPromoted }    = require('./notificationService');

const getBaseUrl = () => process.env.FRONTEND_URL || process.env.BASE_URL || 'http://localhost:3000';

/**
 * Attempt to promote the next user on the waitlist for `eventId`.
 * If a specific `ticketType` was freed (when the event has ticket types),
 * we look for an entry requesting the same type first, then fall back to
 * any waiting entry.
 *
 * @param {ObjectId|string} eventId
 * @param {string|null}     freedTicketType  — ticket type from the cancelled reservation
 * @param {number}          freedCount       — number of tickets freed
 * @returns {Promise<Object|null>} promoted reservation document, or null
 */
const promoteFromWaitlist = async (eventId, freedTicketType, freedCount) => {
  // Find the next waiting entry — prioritise same ticket type if relevant
  const query = {
    event: eventId,
    status: 'waiting',
    numberOfTickets: { $lte: freedCount },
  };

  if (freedTicketType) {
    query.ticketType = freedTicketType;
  }

  let entry = await WaitlistEntry.findOne(query).sort({ createdAt: 1 });

  // Fallback: any ticket type if none found for the specific type
  if (!entry && freedTicketType) {
    delete query.ticketType;
    entry = await WaitlistEntry.findOne(query).sort({ createdAt: 1 });
  }

  if (!entry) return null;

  const [event, user] = await Promise.all([
    Event.findById(eventId),
    User.findById(entry.user),
  ]);

  if (!event || !user) {
    // Stale entry — expire it silently
    entry.status = 'expired';
    await entry.save();
    return null;
  }

  // Resolve unit price (handle early bird)
  let unitPrice = event.price;
  let isEarlyBird = false;
  const resolvedTicketType = entry.ticketType;

  if (event.ticketTypes && event.ticketTypes.length > 0 && resolvedTicketType) {
    const pricing = event.getTicketPrice(resolvedTicketType);
    if (pricing) {
      unitPrice = pricing.unitPrice;
      isEarlyBird = pricing.isEarlyBird;
    }
  }

  const totalPrice = unitPrice * entry.numberOfTickets;

  // Create the confirmed reservation
  const reservation = await Reservation.create({
    user: user._id,
    event: event._id,
    numberOfTickets: entry.numberOfTickets,
    ticketType: resolvedTicketType,
    unitPrice,
    isEarlyBird,
    totalPrice,
    status: 'confirmed',
  });

  // Update many-to-many references
  await Promise.all([
    Event.findByIdAndUpdate(eventId, { $addToSet: { participants: user._id } }),
    User.findByIdAndUpdate(user._id, { $addToSet: { events: eventId } }),
  ]);

  // Mark the entry as promoted
  entry.status      = 'promoted';
  entry.promotedAt  = new Date();
  entry.reservation = reservation._id;
  await entry.save();

  // Generate QR code (fire-and-forget)
  try {
    const qrCodeDataUrl = await generateReservationQRCode(reservation, event, user, getBaseUrl());
    reservation.qrCode = qrCodeDataUrl;
    await reservation.save();
  } catch (qrErr) {
    console.error('[Waitlist] QR generation failed:', qrErr.message);
  }

  // Notify the user
  await notifyWaitlistPromoted(user, event, reservation);

  console.log(`[Waitlist] Promoted user ${user.email} for event "${event.title}" (reservation ${reservation._id})`);
  return reservation;
};

module.exports = { promoteFromWaitlist };
