const request = require('supertest');
const app = require('../app');  // Adjust path as needed
const { Slot, User, Office } = require('../models');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/jwt');

describe('Admin Slots API', () => {
  let adminToken;
  let userToken;
  let testOfficeId;

  beforeAll(async () => {
    // Create test office
    const office = await Office.create({
      name: 'Test Office',
      address: '123 Test St',
      city: 'Test City',
    });
    testOfficeId = office.id;

    // Create admin user
    const admin = await User.create({
      email: 'admin@test.com',
      password: 'hashedpassword',
      role: 'admin'
    });

    // Create regular user
    const user = await User.create({
      email: 'user@test.com',
      password: 'hashedpassword',
      role: 'user'
    });

    // Generate tokens
    adminToken = jwt.sign({ id: admin.id, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    userToken = jwt.sign({ id: user.id, role: 'user' }, JWT_SECRET, { expiresIn: '1h' });
  });

  afterAll(async () => {
    await Slot.destroy({ where: {} });
    await Office.destroy({ where: { id: testOfficeId } });
    await User.destroy({ where: { email: ['admin@test.com', 'user@test.com'] } });
  });

  describe('POST /api/admin/slots', () => {
    it('should create slots when admin sends valid data', async () => {
      // Create tomorrow's date
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const slots = [
        { officeId: testOfficeId, date: tomorrowStr, time: '09:00', capacity: 10 },
        { officeId: testOfficeId, date: tomorrowStr, time: '10:00', capacity: 5 }
      ];

      const response = await request(app)
        .post('/api/admin/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(slots);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(2);

      // Verify slots were created in DB
      const createdSlots = await Slot.findAll({
        where: {
          officeId: testOfficeId,
          date: tomorrowStr
        }
      });
      expect(createdSlots.length).toBe(2);
    });

    it('should reject non-admin users', async () => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const slots = [
        { officeId: testOfficeId, date: tomorrowStr, time: '11:00', capacity: 10 }
      ];

      const response = await request(app)
        .post('/api/admin/slots')
        .set('Authorization', `Bearer ${userToken}`)
        .send(slots);

      expect(response.status).toBe(403);
    });

    it('should handle validation errors', async () => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];

      const slots = [
        { officeId: testOfficeId, date: yesterdayStr, time: '09:00', capacity: 10 }
      ];

      const response = await request(app)
        .post('/api/admin/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(slots);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle creating 100 slots in a single request', async () => {
      // Create slots for 10 days with 10 time slots each
      const slots = [];
      for (let day = 1; day <= 10; day++) {
        const date = new Date();
        date.setDate(date.getDate() + day);
        const dateStr = date.toISOString().split('T')[0];

        for (let hour = 9; hour < 19; hour++) {
          slots.push({
            officeId: testOfficeId,
            date: dateStr,
            time: `${hour.toString().padStart(2, '0')}:00`,
            capacity: 5
          });
        }
      }

      expect(slots.length).toBe(100);

      const response = await request(app)
        .post('/api/admin/slots')
        .set('Authorization', `Bearer ${adminToken}`)
        .send(slots);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.count).toBe(100);
    });
  });
});
