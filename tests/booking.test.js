const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server'); // Import your Express app
const Booking = require('../backend/models/Booking');

// Mock auth middleware
jest.mock('../backend/middleware/auth', () => {
  return (req, res, next) => {
    req.user = { id: '507f1f77bcf86cd799439011' }; // Mock user ID
    next();
  };
});

describe('Booking API', () => {
  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.MONGO_URI_TEST || 'mongodb://localhost:27017/test-booking', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      useCreateIndex: true
    });
  });

  afterAll(async () => {
    // Clean up and disconnect from the database
    await mongoose.connection.db.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // Clear bookings collection before each test
    await Booking.deleteMany({});
  });

  describe('POST /api/bookings', () => {
    it('should create a new booking', async () => {
      const bookingData = {
        userId: '507f1f77bcf86cd799439011',
        officeId: '507f1f77bcf86cd799439012',
        slotId: '507f1f77bcf86cd799439013',
        date: new Date('2023-01-01T10:00:00Z')
      };

      const res = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(res.statusCode).toEqual(201);
      expect(res.body).toHaveProperty('_id');
      expect(res.body.userId).toBe(bookingData.userId);
    });

    it('should not create booking with invalid data', async () => {
      const bookingData = {
        // Missing required fields
        date: new Date('2023-01-01T10:00:00Z')
      };

      const res = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(res.statusCode).toEqual(400);
      expect(res.body).toHaveProperty('errors');
    });

    it('should not allow duplicate bookings', async () => {
      const bookingData = {
        userId: '507f1f77bcf86cd799439011',
        officeId: '507f1f77bcf86cd799439012',
        slotId: '507f1f77bcf86cd799439013',
        date: new Date('2023-01-01T10:00:00Z')
      };

      // First booking should succeed
      await request(app)
        .post('/api/bookings')
        .send(bookingData);

      // Second identical booking should fail
      const res = await request(app)
        .post('/api/bookings')
        .send(bookingData);

      expect(res.statusCode).toEqual(409);
    });
  });
});
