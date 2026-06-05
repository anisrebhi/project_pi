/**
 * @file app.js
 * @description Express application factory — configures middleware, mounts routes,
 *              serves static files, sets up Swagger docs, and registers error handlers.
 *              Kept separate from server.js for testability.
 */

const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");
const path = require("path");
const rateLimit = require("express-rate-limit");
const swaggerUi = require("swagger-ui-express");

const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const eventRoutes = require("./routes/eventRoutes");
const { notFoundHandler, globalErrorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ─── Security Middleware ──────────────────────────────────────────────────────

/**
 * Helmet — sets secure HTTP headers (XSS, clickjacking, etc.)
 * Configured to allow Swagger UI's inline scripts
 */
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'"], // Required for Swagger UI
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false, // Required for Swagger UI
  })
);

/**
 * CORS — allow all origins in development; restrict in production
 */
const corsOptions = {
  origin:
    process.env.NODE_ENV === "production"
      ? process.env.ALLOWED_ORIGINS?.split(",") || []
      : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

// ─── Rate Limiting ────────────────────────────────────────────────────────────

/**
 * Global rate limiter — 200 requests per 15 minutes per IP
 */
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many requests from this IP. Please try again in 15 minutes.",
  },
});

/**
 * Auth-specific rate limiter — stricter: 20 requests per 15 minutes
 */
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: "Too many authentication attempts. Please wait 15 minutes and try again.",
  },
});

app.use(globalLimiter);

// ─── Request Parsing ──────────────────────────────────────────────────────────

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// ─── Logging ──────────────────────────────────────────────────────────────────

/**
 * Morgan — HTTP request logger
 * 'dev' format in development, 'combined' (Apache-style) in production
 */
if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

// ─── Static Files ─────────────────────────────────────────────────────────────

/**
 * Serve uploaded profile images at /uploads/profiles/<filename>
 * e.g. GET http://localhost:5000/uploads/profiles/64f1a2b3-1706000000000.jpg
 */
app.use(
  "/uploads",
  express.static(path.join(__dirname, "uploads"), {
    maxAge: "7d", // Cache static assets for 7 days
    etag: true,
  })
);

// ─── API Documentation ────────────────────────────────────────────────────────

/**
 * Swagger UI — available at /api-docs
 * Interactive API explorer for all routes
 */
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: "Event Management API Docs",
    customCss: `
      .swagger-ui .topbar { background-color: #1a1a2e; }
      .swagger-ui .topbar-wrapper img { display: none; }
      .swagger-ui .topbar-wrapper::after {
        content: '🎫 Event Management API';
        color: white;
        font-size: 1.2rem;
        font-weight: bold;
      }
    `,
    swaggerOptions: {
      persistAuthorization: true, // Keep JWT token across page refreshes
      docExpansion: "list",
      filter: true,
    },
  })
);

/**
 * Raw Swagger JSON — useful for code generation tools
 */
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// ─── Health Check ─────────────────────────────────────────────────────────────

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health]
 *     summary: API health check
 *     security: []
 *     responses:
 *       200:
 *         description: API is running
 */
app.get("/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Event Management API is running",
    version: "1.0.0",
    environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(),
    uptime: `${Math.floor(process.uptime())}s`,
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────

app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/events", eventRoutes);

// ─── Root Route ───────────────────────────────────────────────────────────────

app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to the Event Management API",
    docs: `${req.protocol}://${req.get("host")}/api-docs`,
    health: `${req.protocol}://${req.get("host")}/health`,
    version: "1.0.0",
  });
});

// ─── Error Handlers (must be LAST) ───────────────────────────────────────────

app.use(notFoundHandler);      // 404 for unknown routes
app.use(globalErrorHandler);   // Global error formatter

module.exports = app;
