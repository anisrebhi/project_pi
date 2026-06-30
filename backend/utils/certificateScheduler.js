/**
 * @file utils/certificateScheduler.js
 * @description Auto-generates and auto-sends certificates to all confirmed
 *              participants within 2 hours after an event ends.
 *
 * Runs every 15 minutes. For each event that ended 0–2h ago:
 *   1. Creates PENDING certificates for all confirmed reservations (idempotent)
 *   2. Auto-validates them
 *   3. Sends the PDF by email
 *
 * Start with: require('./utils/certificateScheduler').start()
 */
const Certificate                = require('../models/Certificate');
const Reservation                = require('../models/Reservation');
const Event                      = require('../models/Event');
const { generateCertificatePDF } = require('./certificateGenerator');
const { sendMail: sendEmail }    = require('./emailService');
const { buildCertificateEmail }  = require('./emailTemplates');
const crypto                     = require('crypto');

const CHECK_INTERVAL_MS = 15 * 60 * 1000;  // 15 minutes
const WINDOW_LOW_MS     =  0 * 60 * 60 * 1000;
const WINDOW_HIGH_MS    =  2 * 60 * 60 * 1000; // within 2h after end

let intervalHandle = null;

const generateCode = () => crypto.randomUUID().replace(/-/g, '').toUpperCase();

const runCertificateCheck = async () => {
  const now  = Date.now();
  const low  = new Date(now - WINDOW_HIGH_MS);
  const high = new Date(now - WINDOW_LOW_MS);

  // Events that ended within the last 2 hours
  const recentlyEndedEvents = await Event.find({
    endDate: { $gte: low, $lte: high },
    isActive: true,
  }).populate('organizer', 'fullName email');

  if (!recentlyEndedEvents.length) return;

  console.log(`📜 CertScheduler: checking ${recentlyEndedEvents.length} recently ended event(s)`);

  for (const event of recentlyEndedEvents) {
    try {
      const reservations = await Reservation.find({ event: event._id, status: 'confirmed' })
        .populate('user', 'fullName email');

      for (const reservation of reservations) {
        const user = reservation.user;
        if (!user?.email) continue;

        // Skip if already sent
        const existing = await Certificate.findOne({ user: user._id, event: event._id });
        if (existing && ['sent', 'downloaded'].includes(existing.status)) continue;

        let cert = existing;

        // Create if not exists
        if (!cert) {
          cert = await Certificate.create({
            user: user._id,
            event: event._id,
            reservation: reservation._id,
            verificationCode: generateCode(),
            status: 'pending',
          });
        }

        // Validate if pending
        if (cert.status === 'pending') {
          cert.status      = 'validated';
          cert.validatedAt = new Date();
          await cert.save();
        }

        // Send email if validated or not yet sent
        if (cert.status === 'validated') {
          try {
            const pdfBuffer = await generateCertificatePDF({ user, event, verificationCode: cert.verificationCode });
            const emailContent = buildCertificateEmail({ user, event, verificationCode: cert.verificationCode, pdfBuffer });
            await sendEmail({ to: user.email, ...emailContent });
            cert.status      = 'sent';
            cert.emailSentAt = new Date();
            await cert.save();
            console.log(`✅ Certificate sent to ${user.email} for event: ${event.title}`);
          } catch (mailErr) {
            console.error(`❌ Failed to send certificate to ${user.email}:`, mailErr.message);
          }
        }
      }
    } catch (eventErr) {
      console.error(`CertScheduler error for event ${event._id}:`, eventErr.message);
    }
  }
};

const start = () => {
  if (intervalHandle) return;
  console.log('📜 Certificate auto-scheduler started (every 15 min)');
  runCertificateCheck().catch(console.error); // Run immediately once
  intervalHandle = setInterval(() => {
    runCertificateCheck().catch(console.error);
  }, CHECK_INTERVAL_MS);
};

const stop = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('📜 Certificate scheduler stopped');
  }
};

module.exports = { start, stop };
