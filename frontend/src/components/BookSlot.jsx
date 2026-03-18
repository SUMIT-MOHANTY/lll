import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { bookSlot } from '../services/booking';

/**
 * BookSlot Component
 *
 * A button component for booking appointment slots with confirmation dialog,
 * loading states, and error handling.
 */
const BookSlot = ({
  slotId,
  onSuccess,
  onError,
  disabled = false,
  buttonText = 'Book Appointment'
}) => {
  // Component state
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);

  /**
   * Show the confirmation dialog when user clicks book
   */
  const handleBookClick = () => {
    setShowConfirmation(true);
    setErrorMessage(null);
  };

  /**
   * Cancel the booking process
   */
  const handleCancel = () => {
    setShowConfirmation(false);
    setErrorMessage(null);
  };

  /**
   * Handle the booking confirmation
   */
  const handleConfirmBooking = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      console.log('Confirming slot booking for slotId:', slotId);
      const result = await bookSlot(slotId);

      if (result.success) {
        console.log('Booking successful:', result.data);
        setShowConfirmation(false);

        // Call the onSuccess callback with the booking data
        if (onSuccess && typeof onSuccess === 'function') {
          onSuccess(result.data);
        }

        // Show success toast (using whatever notification system is in the project)
        showToast('success', `Appointment booked successfully! Reference: ${result.data.reference}`);
      } else {
        // Handle error from the service
        console.error('Booking failed:', result.error);
        setErrorMessage(result.error);

        // Call the onError callback with the error details
        if (onError && typeof onError === 'function') {
          onError(result);
        }
      }
    } catch (error) {
      console.error('Unexpected error during booking:', error);
      setErrorMessage('An unexpected error occurred. Please try again.');

      if (onError && typeof onError === 'function') {
        onError({ success: false, error: error.message });
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * Helper function to show toast notifications
   * This should be replaced with the actual toast implementation used in the project
   */
  const showToast = (type, message) => {
    // This is a placeholder - replace with the actual toast implementation
    // For example: toast.success(message) or notification.open({ type, message })
    console.log(`TOAST [${type}]:`, message);

    // Check for common toast libraries and use them if available
    if (window.toast) {
      window.toast[type](message);
    } else if (window.notification) {
      window.notification.open({ type, message });
    } else if (window.toastify) {
      window.toastify({ text: message, type });
    }
  };

  return (
    <div className="book-slot-component">
      {/* Main booking button */}
      <button
        className="booking-button primary-button"
        onClick={handleBookClick}
        disabled={disabled || isLoading}
        data-testid="book-slot-button"
      >
        {isLoading ? 'Processing...' : buttonText}
      </button>

      {/* Confirmation dialog */}
      {showConfirmation && (
        <div className="confirmation-dialog">
          <div className="confirmation-dialog-content">
            <h3>Confirm Booking</h3>
            <p>Are you sure you want to book this appointment slot?</p>

            {/* Show error message if there is one */}
            {errorMessage && (
              <div className="error-message" data-testid="booking-error">
                {errorMessage}
              </div>
            )}

            <div className="confirmation-actions">
              <button
                className="cancel-button secondary-button"
                onClick={handleCancel}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                className="confirm-button primary-button"
                onClick={handleConfirmBooking}
                disabled={isLoading}
                data-testid="confirm-booking-button"
              >
                {isLoading ? (
                  <span className="loading-spinner">
                    Processing...
                  </span>
                ) : 'Confirm Booking'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// PropTypes for component props validation
BookSlot.propTypes = {
  slotId: PropTypes.string.isRequired,
  onSuccess: PropTypes.func,
  onError: PropTypes.func,
  disabled: PropTypes.bool,
  buttonText: PropTypes.string
};

export default BookSlot;
