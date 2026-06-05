/**
 * @file config/db.js
 * @description MongoDB connection configuration using Mongoose
 */

const mongoose = require("mongoose");

/**
 * Connects to MongoDB with retry logic and proper event handling
 */
const connectDB = async () => {
  // ─── Guard: ensure MONGODB_URI is defined ────────────────────────────────
  if (!process.env.MONGODB_URI) {
    console.error(
      " MONGODB_URI is not defined.\n" +
      "   → Make sure a .env file exists at the project root.\n" +
      "   → Copy .env.example to .env and fill in your values:\n" +
      "       cp .env.example .env"
    );
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, {
      serverSelectionTimeoutMS: 10000, // Wait 10s before giving up
      socketTimeoutMS: 45000,          // Close sockets after 45s of inactivity
    });

    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    console.error(`   → Make sure MongoDB is running: mongod`);
    console.error(`   → Or check your MONGODB_URI in .env`);
    // Throw instead of process.exit so server.js can handle it cleanly
    throw error;
  }
};

// ─── Mongoose Connection Events ──────────────────────────────────────────────

mongoose.connection.on("disconnected", () => {
  console.warn("  MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log(" MongoDB reconnected successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error(` MongoDB error: ${err.message}`);
});

// ─── Graceful Shutdown ────────────────────────────────────────────────────────

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log(" MongoDB connection closed due to app termination.");
  process.exit(0);
});

module.exports = connectDB;
