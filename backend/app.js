const express    = require("express");
const fs         = require("fs");
const cors       = require("cors");
const helmet     = require("helmet");
const morgan     = require("morgan");
const path       = require("path");
const rateLimit  = require("express-rate-limit");
const swaggerUi  = require("swagger-ui-express");

const swaggerSpec            = require("./config/swagger");
const authRoutes             = require("./routes/authRoutes");
const userRoutes             = require("./routes/userRoutes");
const eventRoutes            = require("./routes/eventRoutes");
const reservationRoutes      = require("./routes/reservationRoutes");
const promoCodeRoutes        = require("./routes/promoCodeRoutes");
const waitlistRoutes         = require("./routes/waitlistRoutes");
const reclamationRoutes      = require("./routes/reclamationRoutes");
const formationRoutes        = require("./routes/formationRoutes");
// ── Lot 2 ──────────────────────────────────────────────────────────────────────
const certificateRoutes      = require("./routes/certificateRoutes");
const reviewRoutes           = require("./routes/reviewRoutes");
const messageRoutes          = require("./routes/messageRoutes");
const photoRoutes            = require("./routes/photoRoutes");
const recommendationRoutes   = require("./routes/recommendationRoutes");

const { notFoundHandler, globalErrorHandler } = require("./middleware/errorMiddleware");

const app = express();

// ─── Ensure upload directories exist ─────────────────────────────────────────
["uploads/events", "uploads/gallery"].forEach((dir) => {
  const full = path.join(__dirname, dir);
  if (!fs.existsSync(full)) fs.mkdirSync(full, { recursive: true });
});

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
  windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: "Too many requests. Please try again in 15 minutes." },
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, max: 20, standardHeaders: true, legacyHeaders: false,
  message: { success: false, message: "Too many authentication attempts. Wait 15 minutes." },
});

app.use(globalLimiter);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

if (process.env.NODE_ENV === "development") app.use(morgan("dev"));
else app.use(morgan("combined"));

app.use("/uploads", express.static(path.join(__dirname, "uploads"), { maxAge: "7d", etag: true }));

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  explorer: true, customSiteTitle: "Event Management API Docs",
  swaggerOptions: { persistAuthorization: true, docExpansion: "list", filter: true },
}));

app.get("/health", (req, res) => {
  res.status(200).json({ success: true, message: "API running", version: "2.0.0", timestamp: new Date().toISOString() });
});

// ─── Inject Socket.IO into req so controllers can emit events ─────────────────
app.use((req, res, next) => {
  if (app.get('io')) req.io = app.get('io');
  next();
});

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use("/api/auth",            authLimiter, authRoutes);
app.use("/api/users",           userRoutes);
app.use("/api/events",          eventRoutes);
app.use("/api/reservations",    reservationRoutes);
app.use("/api/promo-codes",     promoCodeRoutes);
app.use("/api/waitlist",        waitlistRoutes);
app.use("/api/reclamations",    reclamationRoutes);
app.use("/api/formations",      formationRoutes);
// ── Lot 2 ─────────────────────────────────────────────────────────────────────
app.use("/api/certificates",    certificateRoutes);
app.use("/api/reviews",         reviewRoutes);
app.use("/api/messages",        messageRoutes);
app.use("/api/photos",          photoRoutes);
app.use("/api/recommendations", recommendationRoutes);

app.get("/", (req, res) => {
  res.status(200).json({ success: true, message: "EventPass API v2", docs: `${req.protocol}://${req.get("host")}/api-docs` });
});

app.use(notFoundHandler);
app.use(globalErrorHandler);

module.exports = app;
