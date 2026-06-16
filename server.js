/**
 * @file server.js
 * @description Application entry point — loads environment variables,
 *              connects to MongoDB, then starts the HTTP server.
 *              Handles graceful shutdown on SIGTERM/SIGINT.
 */

require("dotenv").config();
const app = require("./app");
const connectDB = require("./config/db");

const PORT = process.env.PORT || 5000;

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(PORT, () => {
      console.log("\n========================================");
      console.log("    Event Management API");
      console.log("========================================");
      console.log(`   Server     : http://localhost:${PORT}`);
      console.log(`   API Docs   : http://localhost:${PORT}/api-docs`);
      console.log(`   Health     : http://localhost:${PORT}/health`);
      console.log(`   Environment: ${process.env.NODE_ENV || "development"}`);
      console.log("========================================\n");
    });

    const gracefulShutdown = (signal) => {
      console.log(`\n  Received ${signal}. Shutting down gracefully...`);
      server.close((err) => {
        if (err) {
          console.error(" Error during server shutdown:", err.message);
          process.exit(1);
        }
        console.log(" HTTP server closed.");
        process.exit(0);
      });
      setTimeout(() => {
        console.error("  Forced shutdown after timeout.");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    process.on("unhandledRejection", (reason, promise) => {
      console.error(" Unhandled Promise Rejection at:", promise);
      console.error("   Reason:", reason);
      server.close(() => process.exit(1));
    });

    process.on("uncaughtException", (err) => {
      console.error(" Uncaught Exception:", err.message);
      console.error(err.stack);
      process.exit(1);
    });

    return server;
  } catch (error) {
    console.error(" Failed to start server:", error.message);
    process.exit(1);
  }
};

startServer();
