/**
 * @file server.js
 * @description Application entry point — loads environment variables,
 *              connects to MongoDB, then starts the HTTP server.
 *              Handles graceful shutdown on SIGTERM/SIGINT.
 */

const express = require('express');

const path    = require('path');
const corsLib = require('cors');

const connectDB                  = require('./config/db');
const eventRoutes                = require('./routes/eventRoutes');
const userRoutes                 = require('./routes/userRoutes');
const reservationRoutes          = require('./routes/reservationRoutes');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');


connectDB();

const app = express();


app.use(corsLib());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Event Management API v2 is running',
    version: '2.0.0',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});

app.use('/api/events',       eventRoutes);
app.use('/api/users',        userRoutes);
app.use('/api/reservations', reservationRoutes);

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(` Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  console.log(` Uploads served at http://localhost:${PORT}/uploads`);
});

const startServer = async () => {
  try {
    // 1. Connect to MongoDB
    await connectDB();

    // 2. Start HTTP server
    const server = app.listen(PORT, () => {
      console.log("\n========================================");
      console.log("    Event Management API");
      console.log("========================================");
      console.log(`   Server     : http://localhost:${PORT}`);
      console.log(`   API Docs   : http://localhost:${PORT}/api-docs`);
      console.log(`    Health     : http://localhost:${PORT}/health`);
      console.log(`  Environment: ${NODE_ENV}`);
      console.log("========================================\n");
    });

    // ─── Graceful Shutdown ──────────────────────────────────────
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

      // Force shutdown after 10 seconds if graceful close fails
      setTimeout(() => {
        console.error("  Forced shutdown after timeout.");
        process.exit(1);
      }, 10_000);
    };

    process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
    process.on("SIGINT", () => gracefulShutdown("SIGINT"));

    // ─── Unhandled Promise Rejections ───────────────────────────
    process.on("unhandledRejection", (reason, promise) => {
      console.error(" Unhandled Promise Rejection at:", promise);
      console.error("   Reason:", reason);
      // Close server and exit (let process manager restart)
      server.close(() => process.exit(1));
    });

    // ─── Uncaught Exceptions ────────────────────────────────────
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
