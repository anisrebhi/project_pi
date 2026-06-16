/**
 * @file config/db.js
 * @description MongoDB connection configuration using Mongoose
 */

const mongoose = require("mongoose");

const connectDB = async () => {
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
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });

    console.log(` MongoDB Connected: ${conn.connection.host}`);
    console.log(` Database: ${conn.connection.name}`);
  } catch (error) {
    console.error(` MongoDB Connection Error: ${error.message}`);
    console.error(`   → Make sure MongoDB is running: mongod`);
    console.error(`   → Or check your MONGODB_URI in .env`);
    throw error;
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("  MongoDB disconnected. Attempting to reconnect...");
});

mongoose.connection.on("reconnected", () => {
  console.log(" MongoDB reconnected successfully.");
});

mongoose.connection.on("error", (err) => {
  console.error(` MongoDB error: ${err.message}`);
});

process.on("SIGINT", async () => {
  await mongoose.connection.close();
  console.log(" MongoDB connection closed due to app termination.");
  process.exit(0);
});

module.exports = connectDB;
