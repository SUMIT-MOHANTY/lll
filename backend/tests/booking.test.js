const request = require('supertest');
const mongoose = require('mongoose');
const express = require('express');
const bookingRoutes = require('../routes/bookings');
const Booking = require('../models/Booking');

// Mock auth middleware
jest.mock('../middleware/auth', () => {
  return (req, res, next) => {
    req.userData = { userId: new mongoose.Types.ObjectId() };
    next();
  };
});

// Mock logger
jest.mock('../config/logger', () => {
  return {
    info: jest.fn(),
    warn: jest.fn(),
    error: jest.fn()
  };
});

// Create test app
const app = express();
app.use(express.json());
app.use('/api/bookings', bookingRoutes);

describe('Booking API', () => {
  beforeAll(async () => {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/test_db', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  });

  afterAll(async () => {
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await Booking.deleteMany({});
  });

  describe('POST /api/bookings', () => {
    test('Should create a new booking with valid data', async () => {
      const bookingData = {
        officeId: new mongoose.Types.ObjectId().toString(),
        slotId: new mongoose.Types.ObjectId().toString(),
        date: new Date().toISOString().split('T')[0]
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(response.statusCode).toBe(201);
      expect(response.body).toHaveProperty('booking');
      expect(response.body.booking.officeId).toBe(bookingData.officeId);
    });

    test('Should not allow duplicate bookings for same user, office, and date', async () => {
      const bookingData = {
        officeId: new mongoose.Types.ObjectId().toString(),
        slotId: new mongoose.Types.ObjectId().toString(),
        date: new Date().toISOString().split('T')[0]
      };

      // First booking should succeed
      await request(app)
        .post('/api/bookings')
        .send(bookingData);

      // Second booking should fail with 409 Conflict
      const response = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(response.statusCode).toBe(409);
      expect(response.body).toHaveProperty('error');
    });

    test('Should reject invalid input data', async () => {
      const invalidData = {
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/bookings')
        .send(invalidData);

      expect(response.statusCode).toBe(400);
    });
  });
});
