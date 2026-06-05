require('dotenv').config();

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

module.exports = app;
