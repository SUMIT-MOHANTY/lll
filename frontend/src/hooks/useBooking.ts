import { useState } from 'react';
import bookingService, { BookingRequest, BookingResponse } from '../services/bookingService';

/**
 * Custom hook for booking functionality
 */
export const useBooking = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [booking, setBooking] = useState<BookingResponse | null>(null);

  /**
   * Book a slot
   * @param slotId ID of the slot to book
   * @returns Promise resolving to the created booking or undefined on error
   */
  const bookSlot = async (slotId: string): Promise<BookingResponse | undefined> => {
    setLoading(true);
    setError(null);

    try {
      const bookingData: BookingRequest = { slotId };
      const response = await bookingService.createBooking(bookingData);

      setBooking(response);
      setLoading(false);
      return response;
    } catch (err: any) {
      setError(err.message || 'Failed to book appointment');
      setLoading(false);
      return undefined;
    }
  };

  /**
   * Reset the booking state
   */
  const resetBooking = () => {
    setBooking(null);
    setError(null);
  };

  return {
    loading,
    error,
    booking,
    bookSlot,
    resetBooking
  };
};

export default useBooking;
