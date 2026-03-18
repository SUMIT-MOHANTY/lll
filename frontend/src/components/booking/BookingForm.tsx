import React, { useState } from 'react';
import useBooking from '../../hooks/useBooking';

interface Slot {
  id: string;
  officeId: string;
  officeName: string;
  date: string;
  time: string;
  capacity: number;
  booked: number;
  available: number;
}

interface BookingFormProps {
  slot: Slot;
  onBookingComplete: () => void;
}

/**
 * Component for booking a specific slot
 */
const BookingForm: React.FC<BookingFormProps> = ({ slot, onBookingComplete }) => {
  const { loading, error, booking, bookSlot } = useBooking();
  const [isConfirmed, setIsConfirmed] = useState(false);

  /**
   * Handle booking submission
   */
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (loading) return;

    try {
      const result = await bookSlot(slot.id);
      if (result) {
        setIsConfirmed(true);
        // Wait a bit before closing the form to show confirmation
        setTimeout(() => {
          onBookingComplete();
        }, 2000);
      }
    } catch (err) {
      console.error('Booking error:', err);
    }
  };

  if (isConfirmed) {
    return (
      <div className="booking-confirmation">
        <h3>Booking Confirmed!</h3>
        <p>Your appointment has been booked for:</p>
        <p>
          <strong>Date:</strong> {slot.date} at {slot.time}
        </p>
        <p>
          <strong>Location:</strong> {slot.officeName}
        </p>
        <p>You will receive a confirmation email shortly.</p>
      </div>
    );
  }

  return (
    <div className="booking-form">
      <h3>Book Appointment</h3>
      <p>
        <strong>Date:</strong> {slot.date}
      </p>
      <p>
        <strong>Time:</strong> {slot.time}
      </p>
      <p>
        <strong>Location:</strong> {slot.officeName}
      </p>
      <p>
        <strong>Available Slots:</strong> {slot.available} of {slot.capacity}
      </p>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-actions">
          <button
            type="button"
            onClick={onBookingComplete}
            disabled={loading}
            className="cancel-button"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading || slot.available <= 0}
            className="book-button"
          >
            {loading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default BookingForm;
