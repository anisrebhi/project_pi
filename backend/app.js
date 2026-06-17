const express    = require("express");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const path       = require("path");
const rateLimit  = require("express-rate-limit");
const swaggerUi  = require("swagger-ui-express");

const swaggerSpec        = require("./config/swagger");
const authRoutes         = require("./routes/authRoutes");
const userRoutes         = require("./routes/userRoutes");
const eventRoutes        = require("./routes/eventRoutes");
const reservationRoutes  = require("./routes/reservationRoutes");
const reclamationRoutes  = require("./routes/reclamationRoutes");
const formationRoutes    = require("./routes/formationRoutes");
const { notFoundHandler, globalErrorHandler } = require("./middleware/errorMiddleware");

const app = express();

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc:  ["'self'", "'unsafe-inline'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      imgSrc:     ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

const corsOptions = {
  origin: process.env.NODE_ENV === "production"
    ? process.env.ALLOWED_ORIGINS?.split(",") || []
    : "*",
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
};
app.use(cors(corsOptions));

const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 200,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: "Too many requests from this IP. Please try again in 15 minutes." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20,
  standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Please wait 15 minutes and try again." },
});

app.use(globalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else {
  app.use(morgan("combined"));
}

app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "7d", etag: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true,
  customSiteTitle: "Event Management API Docs",
  swaggerOptions: { persistAuthorization: true, docExpansion: "list", filter: true },
}));

app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

app.get("/health", (req, res) => {
  res.status(200).json({
    success: true, message: "Event Management API is running",
    version: "1.0.0", environment: process.env.NODE_ENV || "development",
    timestamp: new Date().toISOString(), uptime: `${Math.floor(process.uptime())}s`,
  });
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",         authLimiter, authRoutes);
app.use("/api/users",        userRoutes);
app.use("/api/events",       eventRoutes);
app.use("/api/reservations", reservationRoutes);
app.use("/api/reclamations", reclamationRoutes);
app.use("/api/formations",   formationRoutes);

app.get("/", (req, res) => {
  res.status(200).json({
    success: true, message: "Welcome to the Event Management API",
    docs: `${req.protocol}://${req.get("host")}/api-docs`,
    health: `${req.protocol}://${req.get("host")}/health`,
    version: "1.0.0",
  });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
