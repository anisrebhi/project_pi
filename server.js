require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const connectDB                    = require('./config/db');
const eventRoutes                  = require('./routes/eventRoutes');
const { notFound, errorHandler }   = require('./middleware/errorMiddleware');


connectDB();


const app = express();


app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: false }));


app.get('/health', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Event Management API is running',
    environment: process.env.NODE_ENV,
    timestamp: new Date().toISOString(),
  });
});


app.use('/api/events', eventRoutes);

app.use(notFound);
app.use(errorHandler);


const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(` Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});

module.exports = app;
