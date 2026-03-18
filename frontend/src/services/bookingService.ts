import axios from 'axios';

const API_URL = '/api';

// Types
export interface BookingRequest {
  slotId: string;
}

export interface BookingResponse {
  id: string;
  slotId: string;
  userId: string;
  status: string;
  createdAt: string;
}

/**
 * Service for interacting with the booking API endpoints
 */
const bookingService = {
  /**
   * Create a new booking for a slot
   * @param bookingData The booking data to create
   * @returns Promise resolving to the created booking
   */
  createBooking: async (bookingData: BookingRequest): Promise<BookingResponse> => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await axios.post<BookingResponse>(
        `${API_URL}/bookings`,
        bookingData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error: any) {
      if (error.response?.status === 409) {
        throw new Error('This slot is already booked');
      }

      throw new Error(
        error.response?.data?.error ||
        'Failed to create booking. Please try again.'
      );
    }
  },

  /**
   * Get all bookings for the current user
   * @returns Promise resolving to the user's bookings
   */
  getUserBookings: async (): Promise<BookingResponse[]> => {
    const token = localStorage.getItem('token');

    if (!token) {
      throw new Error('Authentication required');
    }

    try {
      const response = await axios.get<BookingResponse[]>(
        `${API_URL}/bookings`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      return response.data;
    } catch (error) {
      throw new Error('Failed to fetch bookings');
    }
  }
};

export default bookingService;
