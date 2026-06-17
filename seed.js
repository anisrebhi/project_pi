/**
 * seed.js — Creates test users directly in MongoDB
 * Usage: node seed.js
 *
 * Creates:
 *   admin@esprit.tn        / Admin123!   → ADMIN
 *   organizer@esprit.tn    / Orga123!    → ORGANIZER
 *   participant@esprit.tn  / Part123!    → PARTICIPANT
 */

require("dotenv").config();
const mongoose = require("mongoose");
const { User, ROLES } = require("./models/User");

const USERS = [
  {
    fullName: "Super Admin",
    email: "admin@esprit.tn",
    password: "Admin123!",
    role: ROLES.ADMIN,
    phone: "+21612345678",
  },
  {
    fullName: "Event Organizer",
    email: "organizer@esprit.tn",
    password: "Orga123!",
    role: ROLES.ORGANIZER,
    phone: "+21698765432",
  },
  {
    fullName: "Test Participant",
    email: "participant@esprit.tn",
    password: "Part123!",
    role: ROLES.PARTICIPANT,
    phone: "+21655554444",
  },
];

async function seed() {
  try {
    const uri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/event_management";
    console.log(`\n🔗 Connecting to: ${uri}`);
    await mongoose.connect(uri);
    console.log("✅ Connected to MongoDB\n");

    for (const userData of USERS) {
      const existing = await User.findOne({ email: userData.email }).setOptions({
        includeSoftDeleted: true,
      });

      if (existing) {
        console.log(`⚠️  User already exists: ${userData.email} (role: ${existing.role}) — skipping`);
        continue;
      }

      // User.create() triggers the pre-save hook which hashes the password once
      await User.create({ ...userData });
      console.log(`✅ Created: ${userData.email} | role: ${userData.role} | password: ${userData.password}`);
    }

    console.log("\n📋 Summary of test credentials:");
    console.log("┌─────────────────────────────────────────────────────────────┐");
    console.log("│  Role        │ Email                    │ Password           │");
    console.log("├─────────────────────────────────────────────────────────────┤");
    console.log("│  ADMIN       │ admin@esprit.tn           │ Admin123!          │");
    console.log("│  ORGANIZER   │ organizer@esprit.tn       │ Orga123!           │");
    console.log("│  PARTICIPANT │ participant@esprit.tn     │ Part123!           │");
    console.log("└─────────────────────────────────────────────────────────────┘\n");

  } catch (err) {
    console.error("❌ Seed error:", err.message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log("🔌 Disconnected from MongoDB");
  }
}

seed();
