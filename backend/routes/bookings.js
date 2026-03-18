const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const Booking = require('../models/Booking');
const auth = require('../middleware/auth');
const logger = require('../config/logger');

/**
 * @route   POST /api/bookings
 * @desc    Create a new booking with uniqueness constraint
 * @access  Private
 */
router.post('/', auth, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { officeId, slotId, date } = req.body;
    const userId = req.userData.userId;

    // Input validation
    if (!officeId || !slotId || !date) {
      return res.status(400).json({
        error: 'Missing required fields: officeId, slotId, and date are required'
      });
    }

    // Validate IDs format
    if (!mongoose.Types.ObjectId.isValid(officeId) || !mongoose.Types.ObjectId.isValid(slotId)) {
      return res.status(400).json({ error: 'Invalid officeId or slotId format' });
    }

    // Validate date
    const bookingDate = new Date(date);
    if (isNaN(bookingDate.getTime())) {
      return res.status(400).json({ error: 'Invalid date format' });
    }

    // Check if date is in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (bookingDate < today) {
      return res.status(400).json({ error: 'Cannot book for a date in the past' });
    }

    // Check for duplicate booking
    const isDuplicate = await Booking.checkDuplicateBooking(userId, officeId, date);
    if (isDuplicate) {
      return res.status(409).json({
        error: 'You already have a booking for this office on this date'
      });
    }

    // Create new booking
    const newBooking = new Booking({
      userId,
      officeId,
      slotId,
      date: bookingDate,
      status: 'pending'
    });

    // Save booking
    const savedBooking = await newBooking.save({ session });
    await session.commitTransaction();

    logger.info(`New booking created: ${savedBooking._id} for user ${userId}`);
    res.status(201).json({
      message: 'Booking created successfully',
      booking: savedBooking
    });

  } catch (error) {
    await session.abortTransaction();

    // Check for duplicate key error (MongoDB error code for duplicate key is 11000)
    if (error.code === 11000) {
      logger.warn('Duplicate booking attempt:', error.message);
      return res.status(409).json({
        error: 'You already have a booking for this office on this date'
      });
    }

    logger.error('Error creating booking:', error);
    res.status(500).json({
      error: 'An error occurred while creating the booking',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  } finally {
    session.endSession();
  }
});

// Get all bookings (for testing)
router.get('/', auth, async (req, res) => {
  try {
    const bookings = await Booking.find({ userId: req.userData.userId })
      .sort({ date: -1 });
    res.json(bookings);
  } catch (error) {
    logger.error('Error fetching bookings:', error);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});

module.exports = router;
