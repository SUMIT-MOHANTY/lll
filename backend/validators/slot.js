/**
 * Validator for slot data
 * @module validators/slot
 */
const { isUUID } = require('validator');
const { Office } = require('../models');

/**
 * Validates an array of slot objects for bulk creation
 * @param {Array} slots - Array of slot objects
 * @returns {Object} Validation result with isValid flag and error message if invalid
 */
const validateSlots = async (slots) => {
  if (!Array.isArray(slots)) {
    return { isValid: false, error: 'Input must be an array of slots' };
  }

  if (slots.length === 0) {
    return { isValid: false, error: 'At least one slot must be provided' };
  }

  // Collect all officeIds for batch validation
  const officeIds = [...new Set(slots.map(slot => slot.officeId))];

  // Validate officeIds exist in the database
  try {
    const offices = await Office.findAll({
      where: {
        id: officeIds
      },
      attributes: ['id']
    });

    const validOfficeIds = new Set(offices.map(office => office.id));

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < slots.length; i++) {
      const slot = slots[i];
      const validationError = validateSlot(slot, today, validOfficeIds);

      if (validationError) {
        return { isValid: false, error: `Slot at index ${i}: ${validationError}` };
      }
    }

    return { isValid: true };
  } catch (error) {
    console.error('Error validating office IDs:', error);
    return { isValid: false, error: 'Failed to validate office IDs' };
  }
};

/**
 * Validates a single slot object
 * @param {Object} slot - Slot object to validate
 * @param {Date} today - Today's date for comparison
 * @param {Set} validOfficeIds - Set of valid office IDs
 * @returns {string|null} Error message if invalid, null if valid
 */
const validateSlot = (slot, today, validOfficeIds) => {
  // Check required fields
  if (!slot.officeId || !slot.date || !slot.time || slot.capacity === undefined) {
    return 'Missing required fields: officeId, date, time, capacity';
  }

  // Validate officeId is a valid UUID
  if (!isUUID(slot.officeId)) {
    return 'officeId must be a valid UUID';
  }

  // Validate officeId exists in our database
  if (!validOfficeIds.has(slot.officeId)) {
    return 'officeId does not reference an existing office';
  }

  // Validate date format and value
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(slot.date)) {
    return 'date must be in YYYY-MM-DD format';
  }

  const slotDate = new Date(slot.date);
  if (isNaN(slotDate.getTime())) {
    return 'date must be a valid date';
  }

  // Check if date is not in the past
  if (slotDate < today) {
    return 'date must be greater than or equal to today';
  }

  // Validate time format
  const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;
  if (!timeRegex.test(slot.time)) {
    return 'time must be in HH:MM format';
  }

  // Validate capacity is a positive integer
  if (!Number.isInteger(slot.capacity) || slot.capacity <= 0) {
    return 'capacity must be a positive integer';
  }

  return null;
};

module.exports = {
  validateSlots,
  validateSlot
};
