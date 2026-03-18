const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const morgan = require('morgan');
const logger = require('./backend/config/logger');

// Initialize Express
const app = express();

// Connect Database
mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/passport-booking', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false
})
.then(() => logger.info('MongoDB Connected'))
.catch(err => {
  logger.error(`MongoDB Connection Error: ${err.message}`);
  process.exit(1);
});

// Init Middleware
app.use(express.json({ extended: false }));
app.use(morgan('combined', { stream: logger.stream }));

// Define Routes
app.use('/api/bookings', require('./backend/routes/bookings'));

// Serve static assets in production
if (process.env.NODE_ENV === 'production') {
  // Set static folder
  app.use(express.static('frontend/build'));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, 'frontend', 'build', 'index.html'));
  });
}

// Error handling middleware
app.use((err, req, res, next) => {
  logger.error(`Unhandled error: ${err.stack}`);
  res.status(500).send({ message: 'Server error occurred' });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => logger.info(`Server started on port ${PORT}`));

module.exports = app; // Export for testing
