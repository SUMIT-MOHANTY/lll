/**
 * Admin routes for slot management
 * @module routes/admin/slots
 */
const express = require('express');
const { Slot, sequelize } = require('../../models');
const { validateSlots } = require('../../validators/slot');
const { isAdmin } = require('../../middleware/auth');
const router = express.Router();

/**
 * @route POST /api/admin/slots
 * @desc Bulk create appointment slots
 * @access Private/Admin
 */
router.post('/', isAdmin, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const slots = req.body;

    // Validate slots
    const validationResult = await validateSlots(slots);
    if (!validationResult.isValid) {
      return res.status(400).json({
        success: false,
        error: validationResult.error
      });
    }

    // Format slots to ensure consistent data types
    const formattedSlots = slots.map(slot => ({
      officeId: slot.officeId,
      date: slot.date,
      time: slot.time,
      capacity: parseInt(slot.capacity, 10),
      booked: 0,  // Initialize with zero bookings
      available: parseInt(slot.capacity, 10)  // Initialize available as full capacity
    }));

    // Insert slots using bulkCreate with ignoreDuplicates
    const createdSlots = await Slot.bulkCreate(formattedSlots, {
      ignoreDuplicates: true,
      transaction
    });

    await transaction.commit();

    // Log success
    console.log(`Admin ${req.user.id} created ${createdSlots.length} slots`);

    return res.status(201).json({
      success: true,
      message: 'Slots created successfully',
      count: createdSlots.length
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error creating slots:', error);

    return res.status(500).json({
      success: false,
      error: 'Failed to create slots',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

/**
 * @route GET /api/admin/slots/metrics
 * @desc Get metrics about slots (usage statistics)
 * @access Private/Admin
 */
router.get('/metrics', isAdmin, async (req, res) => {
  try {
    const totalSlots = await Slot.count();
    const bookedSlots = await Slot.sum('booked');
    const availableSlots = await Slot.sum('available');

    return res.status(200).json({
      success: true,
      metrics: {
        totalSlots,
        bookedSlots,
        availableSlots,
        utilizationRate: totalSlots > 0 ? (bookedSlots / (bookedSlots + availableSlots)) * 100 : 0
      }
    });
  } catch (error) {
    console.error('Error fetching slot metrics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch slot metrics'
    });
  }
});

module.exports = router;
