/**
 * @file scripts/seedLot2.js
 * @description Seeds test data for Lot-2 features:
 *   - 1 past event (ended yesterday)
 *   - 1 upcoming event
 *   - 2 confirmed reservations on the past event
 *
 * Usage: node scripts/seedLot2.js
 */
require('dotenv').config();
const mongoose  = require('mongoose');
const bcrypt    = require('bcryptjs');
const { User }  = require('../models/User');
const Event     = require('../models/Event');
const Reservation = require('../models/Reservation');

const run = async () => {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('✅ Connected to MongoDB\n');

  // ── 1. Ensure test users exist ───────────────────────────────────────────
  const hash = await bcrypt.hash('Test1234!', 12);

  const organizer = await User.findOneAndUpdate(
    { email: 'organizer@test.com' },
    { fullName: 'Organisateur Test', email: 'organizer@test.com', password: hash, role: 'ORGANIZER', isActive: true },
    { upsert: true, new: true }
  );

  const participant1 = await User.findOneAndUpdate(
    { email: 'participant1@test.com' },
    { fullName: 'Alice Martin', email: 'participant1@test.com', password: hash, role: 'PARTICIPANT', isActive: true },
    { upsert: true, new: true }
  );

  const participant2 = await User.findOneAndUpdate(
    { email: 'participant2@test.com' },
    { fullName: 'Bob Dupont', email: 'participant2@test.com', password: hash, role: 'PARTICIPANT', isActive: true },
    { upsert: true, new: true }
  );

  console.log(`👤 Organizer:     ${organizer.email}`);
  console.log(`👤 Participant 1: ${participant1.email}`);
  console.log(`👤 Participant 2: ${participant2.email}\n`);

  // ── 2. Past event (ended yesterday) ─────────────────────────────────────
  const yesterday  = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 2  * 24 * 60 * 60 * 1000);

  const pastEvent = await Event.findOneAndUpdate(
    { title: '[TEST] Conférence Intelligence Artificielle 2024' },
    {
      title:       '[TEST] Conférence Intelligence Artificielle 2024',
      description: 'Événement test pour valider les fonctionnalités Lot-2.',
      organizer:   organizer._id,
      startDate:   twoDaysAgo,
      endDate:     yesterday,
      category:    'technology',
      capacity:    50,
      type:        'paid',
      price:       30,
      isActive:    true,
      location:    { address: 'Centre de Conférences, Tunis', coordinates: { lat: 36.8188, lng: 10.1659 } },
      participants: [participant1._id, participant2._id],
    },
    { upsert: true, new: true }
  );

  console.log(`📅 Past event:    ${pastEvent.title}`);
  console.log(`   ID: ${pastEvent._id}\n`);

  // ── 3. Confirmed reservations ────────────────────────────────────────────
  for (const participant of [participant1, participant2]) {
    await Reservation.findOneAndUpdate(
      { event: pastEvent._id, user: participant._id },
      {
        event:           pastEvent._id,
        user:            participant._id,
        numberOfTickets: 1,
        totalPrice:      30,
        status:          'confirmed',
      },
      { upsert: true, new: true }
    );
    console.log(`🎫 Reservation confirmed: ${participant.fullName}`);
  }

  // ── 4. Upcoming event ────────────────────────────────────────────────────
  const nextWeek     = new Date(Date.now() + 7  * 24 * 60 * 60 * 1000);
  const nextWeekEnd  = new Date(Date.now() + 8  * 24 * 60 * 60 * 1000);

  const upcomingEvent = await Event.findOneAndUpdate(
    { title: '[TEST] Workshop Angular 2025' },
    {
      title:       '[TEST] Workshop Angular 2025',
      description: 'Workshop test pour les recommandations et le chat.',
      organizer:   organizer._id,
      startDate:   nextWeek,
      endDate:     nextWeekEnd,
      category:    'technology',
      capacity:    30,
      type:        'free',
      price:       0,
      isActive:    true,
      location:    { address: 'ESPRIT, Tunis' },
    },
    { upsert: true, new: true }
  );

  console.log(`\n📅 Upcoming event: ${upcomingEvent.title}`);
  console.log(`   ID: ${upcomingEvent._id}`);

  // ── Summary ──────────────────────────────────────────────────────────────
  console.log('\n' + '─'.repeat(60));
  console.log('✅ Seed complete!\n');
  console.log('Test credentials (password: Test1234!):');
  console.log(`  Organizer:     organizer@test.com`);
  console.log(`  Participant 1: participant1@test.com`);
  console.log(`  Participant 2: participant2@test.com`);
  console.log(`\nPast event ID:     ${pastEvent._id}`);
  console.log(`Upcoming event ID: ${upcomingEvent._id}`);
  console.log('\nRun tests:');
  console.log(`  TEST_TOKEN="<login token>" TEST_EVENT_ID="${pastEvent._id}" node scripts/testLot2.js`);

  await mongoose.disconnect();
};

run().catch((err) => {
  console.error('Seed failed:', err.message);
  process.exit(1);
});
