const mongoose = require('mongoose');
const logger = require('../config/logger');

/**
 * Booking schema with uniqueness constraint on user, office, and date
 */
const bookingSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User ID is required']
  },
  officeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Office',
    required: [true, 'Office ID is required']
  },
  slotId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Slot',
    required: [true, 'Slot ID is required']
  },
  date: {
    type: Date,
    required: [true, 'Date is required']
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'cancelled'],
    default: 'pending'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

// Create a compound index for uniqueness constraint
bookingSchema.index(
  { userId: 1, officeId: 1, date: 1 },
  { unique: true, name: 'unique_user_office_date' }
);

// Pre-save hook to format date
bookingSchema.pre('save', function(next) {
  // Ensure the time part of the date is set to 00:00:00
  if (this.date) {
    const date = new Date(this.date);
    date.setHours(0, 0, 0, 0);
    this.date = date;
  }
  next();
});

/**
 * Static method to check if a booking already exists for a user on a specific date at an office
 */
bookingSchema.statics.checkDuplicateBooking = async function(userId, officeId, date) {
  try {
    const bookingDate = new Date(date);
    bookingDate.setHours(0, 0, 0, 0);

    const existingBooking = await this.findOne({
      userId,
      officeId,
      date: bookingDate
    });

    return existingBooking !== null;
  } catch (error) {
    logger.error('Error checking duplicate booking:', error);
    throw error;
  }
};

const Booking = mongoose.model('Booking', bookingSchema);

module.exports = Booking;
