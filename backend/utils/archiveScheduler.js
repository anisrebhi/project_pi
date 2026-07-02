const Event       = require('../models/Event');
const Reservation = require('../models/Reservation');

let intervalHandle = null;
const CHECK_INTERVAL_MS = 10 * 60 * 1000;

const runArchiveCheck = async () => {
  try {
    const now = new Date();
    const expired = await Event.find({
      endDate: { $lt: now },
      isArchived: { $ne: true },
      isActive: { $ne: false },
    }).select('_id title endDate');

    if (expired.length === 0) return;

    const ids = expired.map((e) => e._id);
    console.log(`[Archive] Archiving ${expired.length} expired event(s)...`);

    await Event.updateMany(
      { _id: { $in: ids } },
      { $set: { isArchived: true, isActive: false, deletedAt: now } },
    );

    const { modifiedCount } = await Reservation.updateMany(
      { event: { $in: ids }, status: { $in: ['pending', 'confirmed'] } },
      { $set: { status: 'cancelled', cancelledAt: now, cancellationReason: 'Événement archivé' } },
    );

    if (modifiedCount > 0) {
      console.log(`[Archive] Cancelled ${modifiedCount} reservation(s) for archived events.`);
    }
  } catch (err) {
    console.error('[Archive] Scheduler error:', err.message);
  }
};

const start = () => {
  if (intervalHandle) return;
  console.log('[Archive] Expired-event archiver started (interval: 10 min).');
  runArchiveCheck();
  intervalHandle = setInterval(runArchiveCheck, CHECK_INTERVAL_MS);
};

const stop = () => {
  if (intervalHandle) {
    clearInterval(intervalHandle);
    intervalHandle = null;
    console.log('[Archive] Scheduler stopped.');
  }
};

module.exports = { start, stop };
