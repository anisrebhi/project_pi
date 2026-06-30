require('dotenv').config();
const http       = require('http');
const { Server } = require('socket.io');
const app        = require('./app');
const connectDB  = require('./config/db');
const { start: startReminderScheduler }    = require('./utils/reminderScheduler');
const { start: startCertificateScheduler } = require('./utils/certificateScheduler');
const Reservation = require('./models/Reservation');
const Event       = require('./models/Event');
const Message     = require('./models/Message');
const jwt         = require('jsonwebtoken');
const { User }    = require('./models/User');

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();

  const httpServer = http.createServer(app);

  const io = new Server(httpServer, {
    cors: {
      origin: process.env.NODE_ENV === 'production'
        ? process.env.ALLOWED_ORIGINS?.split(',') || []
        : '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  app.set('io', io);

  // ── Socket.IO JWT auth ─────────────────────────────────────────────────────
  io.use(async (socket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers?.authorization?.split(' ')[1];
      if (!token) return next(new Error('Authentication required'));
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user    = await User.findById(decoded.id).select('-password');
      if (!user) return next(new Error('User not found'));
      socket.user = user;
      next();
    } catch {
      next(new Error('Invalid token'));
    }
  });

  // ── Socket.IO handlers ─────────────────────────────────────────────────────
  io.on('connection', (socket) => {
    const user = socket.user;
    console.log(`🔌 Socket: ${user.fullName || user.email} (${user.role})`);

    socket.on('join-event-chat', async ({ eventId }) => {
      try {
        const event = await Event.findById(eventId);
        if (!event) return socket.emit('error', { message: 'Event not found' });

        const isOrganizer = event.organizer.toString() === user._id.toString();
        const isAdmin     = user.role === 'ADMIN';
        let canJoin       = isOrganizer || isAdmin;

        if (!canJoin) {
          const res = await Reservation.findOne({ event: eventId, user: user._id, status: 'confirmed' });
          canJoin   = !!res;
        }

        if (!canJoin) return socket.emit('error', { message: 'Access denied' });

        socket.join(`event-${eventId}`);
        socket.emit('joined-chat', { eventId });
      } catch (err) {
        socket.emit('error', { message: 'Failed to join chat' });
      }
    });

    socket.on('send-message', async ({ eventId, content }) => {
      try {
        if (!content?.trim()) return;
        const rooms = Array.from(socket.rooms);
        if (!rooms.includes(`event-${eventId}`)) {
          return socket.emit('error', { message: 'Join the chat room first' });
        }
        const message   = await Message.create({
          event:  eventId, sender: user._id, content: content.trim(), readBy: [user._id],
        });
        const populated = await message.populate('sender', 'fullName role');
        io.to(`event-${eventId}`).emit('new-message', populated);
      } catch {
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    socket.on('typing',      ({ eventId }) => socket.to(`event-${eventId}`).emit('user-typing',      { userId: user._id, fullName: user.fullName }));
    socket.on('stop-typing', ({ eventId }) => socket.to(`event-${eventId}`).emit('user-stop-typing', { userId: user._id }));
    socket.on('leave-event-chat', ({ eventId }) => socket.leave(`event-${eventId}`));
    socket.on('disconnect', () => console.log(`🔌 Disconnect: ${user.fullName || user.email}`));
  });

  httpServer.listen(PORT, () => {
    console.log(`🚀 Server on port ${PORT} [${process.env.NODE_ENV || 'development'}]`);
    console.log(`📚 Docs: http://localhost:${PORT}/api-docs`);
  });

  startReminderScheduler();
  startCertificateScheduler();
};

start().catch((err) => {
  console.error('Failed to start server:', err.message);
  process.exit(1);
});
