/**
 * Booking service for handling slot booking API operations
 *
 * This service provides methods to interact with the booking endpoints of the API
 * and standardizes error handling and response formatting.
 */

import axios from 'axios';

// Configurable API base URL - should come from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

/**
 * Book an appointment slot for a user
 *
 * @param {string} slotId - The ID of the slot to book
 * @returns {Promise<Object>} - Response containing booking reference and details
 * @throws {Error} - Standardized error with message and status code
 */
export const bookSlot = async (slotId) => {
  console.log(`Attempting to book slot with ID: ${slotId}`);

  try {
    // Input validation
    if (!slotId) {
      throw new Error('Slot ID is required');
    }

    // Get auth token from local storage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('You must be logged in to book an appointment');
    }

    // Make the API call
    console.log('Sending booking request to server...');
    const response = await axios.post(
      `${API_BASE_URL}/bookings`,
      { slotId },
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000 // 10 second timeout
      }
    );

    console.log('Booking successful:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Appointment booked successfully'
    };
  } catch (error) {
    console.error('Error booking slot:', error);

    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timed out. Please try again.',
        code: 'TIMEOUT'
      };
    }

    if (!error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      };
    }

    // Handle API-specific errors
    const status = error.response?.status;
    let errorMessage = 'An unexpected error occurred. Please try again.';
    let errorCode = 'UNKNOWN_ERROR';

    switch (status) {
      case 400:
        errorMessage = error.response.data?.error || 'Invalid request. Please check your details.';
        errorCode = 'INVALID_REQUEST';
        break;
      case 401:
        errorMessage = 'You must be logged in to book an appointment';
        errorCode = 'UNAUTHORIZED';
        break;
      case 403:
        errorMessage = 'You do not have permission to book this slot';
        errorCode = 'FORBIDDEN';
        break;
      case 404:
        errorMessage = 'The selected appointment slot was not found';
        errorCode = 'NOT_FOUND';
        break;
      case 409:
        errorMessage = error.response.data?.error || 'This slot is no longer available';
        errorCode = 'CONFLICT';
        break;
      case 500:
        errorMessage = 'Server error. Please try again later.';
        errorCode = 'SERVER_ERROR';
        break;
    }

    return {
      success: false,
      error: errorMessage,
      code: errorCode,
      details: error.response?.data
    };
  }
};

/**
 * Cancel a booking
 *
 * @param {string} bookingId - The ID of the booking to cancel
 * @returns {Promise<Object>} - Response with cancellation status
 * @throws {Error} - Standardized error with message and status code
 */
export const cancelBooking = async (bookingId) => {
  console.log(`Attempting to cancel booking with ID: ${bookingId}`);

  try {
    // Input validation
    if (!bookingId) {
      throw new Error('Booking ID is required');
    }

    // Get auth token from local storage
    const token = localStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      throw new Error('You must be logged in to cancel a booking');
    }

    // Make the API call
    console.log('Sending cancellation request to server...');
    const response = await axios.delete(
      `${API_BASE_URL}/bookings/${bookingId}`,
      {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        timeout: 8000 // 8 second timeout
      }
    );

    console.log('Cancellation successful:', response.data);
    return {
      success: true,
      data: response.data,
      message: 'Booking cancelled successfully'
    };
  } catch (error) {
    console.error('Error cancelling booking:', error);

    // Similar error handling structure as bookSlot
    // Handle network errors
    if (error.code === 'ECONNABORTED') {
      return {
        success: false,
        error: 'Request timed out. Please try again.',
        code: 'TIMEOUT'
      };
    }

    if (!error.response) {
      return {
        success: false,
        error: 'Network error. Please check your connection and try again.',
        code: 'NETWORK_ERROR'
      };
    }

    // Default error response
    return {
      success: false,
      error: error.response?.data?.error || 'Failed to cancel booking',
      code: `ERROR_${error.response?.status || 'UNKNOWN'}`,
      details: error.response?.data
    };
  }
};

export default {
  bookSlot,
  cancelBooking
};
