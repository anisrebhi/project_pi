require("dotenv").config();
const http      = require("http");
const { Server } = require("socket.io");
const app       = require("./app");
const connectDB = require("./config/db");
const { start: startReminderScheduler } = require("./utils/reminderScheduler");
const Reservation = require("./models/Reservation");
const Event       = require("./models/Event");
const Message     = require("./models/Message");
const jwt         = require("jsonwebtoken");
const { User }    = require("./models/User");

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  // ─── HTTP + Socket.IO server ──────────────────────────────────────────────
  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === "production"
        ? process.env.ALLOWED_ORIGINS?.split(",") || []
        : "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Share io with controllers via app
  app.set("io", io);

  // ─── Socket.IO JWT auth middleware ────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token = socket.handshake.auth?.token || socket.handshake.headers?.authorization?.split(" ")[1];
      if (!token) return next(new Error("Authentication required"));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select("-password");
      if (!user) return next(new Error("User not found"));
      socket.user = user;
      next();
    } catch (err) {
      next(new Error("Invalid token"));
    }
  });

  // ─── Socket.IO connection handler ────────────────────────────────────────
  io.on("connection", (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket connected: ${user.fullName || user.email} (${user.role})`);

    // ── Join event chat room ────────────────────────────────────────────────
    socket.on("join-event-chat", async ({ eventId }) => {
      try {
        const event = await Event.findById(eventId);
        if (!event) return socket.emit("error", { message: "Event not found" });

        const isOrganizer = event.organizer.toString() === user._id.toString();
        const isAdmin     = user.role === "ADMIN";
        let canJoin       = isOrganizer || isAdmin;

        if (!canJoin) {
          const res = await Reservation.findOne({ event: eventId, user: user._id, status: "confirmed" });
          canJoin   = !!res;
        }

        if (!canJoin) {
          return socket.emit("error", { message: "Access denied: not a confirmed participant" });
        }

        socket.join(`event-${eventId}`);
        socket.emit("joined-chat", { eventId, message: "Joined event chat" });
        console.log(`👥 ${user.fullName} joined chat: event-${eventId}`);
      } catch (err) {
        socket.emit("error", { message: "Failed to join chat" });
      }
    });

    // ── Send message via socket ─────────────────────────────────────────────
    socket.on("send-message", async ({ eventId, content }) => {
      try {
        if (!content?.trim()) return;

        const event = await Event.findById(eventId);
        if (!event) return socket.emit("error", { message: "Event not found" });

        // Check the socket is in the room (already verified on join)
        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(`event-${eventId}`)) {
          return socket.emit("error", { message: "Join the chat room first" });
        }

        const message = await Message.create({
          event:   eventId,
          sender:  user._id,
          content: content.trim(),
          readBy:  [user._id],
        });

        const populated = await message.populate("sender", "fullName role");

        // Broadcast to all in room
        io.to(`event-${eventId}`).emit("new-message", populated);
      } catch (err) {
        socket.emit("error", { message: "Failed to send message" });
      }
    });

    // ── Typing indicator ────────────────────────────────────────────────────
    socket.on("typing", ({ eventId }) => {
      socket.to(`event-${eventId}`).emit("user-typing", {
        userId:   user._id,
        fullName: user.fullName,
      });
    });

    socket.on("stop-typing", ({ eventId }) => {
      socket.to(`event-${eventId}`).emit("user-stop-typing", { userId: user._id });
    });

    // ── Leave room ──────────────────────────────────────────────────────────
    socket.on("leave-event-chat", ({ eventId }) => {
      socket.leave(`event-${eventId}`);
      console.log(`👋 ${user.fullName} left chat: event-${eventId}`);
    });

    socket.on("disconnect", () => {
      console.log(`🔌 Socket disconnected: ${user.fullName || user.email}`);
    });
  });

  // ─── Start ────────────────────────────────────────────────────────────────
  httpServer.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT} [${process.env.NODE_ENV || "development"}]`);
    console.log(`📚 API Docs: http://localhost:${PORT}/api-docs`);
    console.log(`🔌 Socket.IO ready`);
  });

  startReminderScheduler();
};

start().catch((err) => {
  console.error("Failed to start server:", err.message);
  process.exit(1);
});
