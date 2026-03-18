import axios from 'axios';
import { API_BASE_URL } from '../config';
import { getAuthHeader } from './authService';

// Types
export interface SlotCreateRequest {
  officeId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  capacity: number;
  description?: string;
}

export interface BookingAnalytics {
  totalBookings: number;
  bookingsByOffice: {
    officeId: string;
    officeName: string;
    bookingCount: number;
  }[];
  bookingsByDate: {
    date: string;
    bookingCount: number;
  }[];
}

export interface OfficeAnalytics {
  id: string;
  name: string;
  totalSlots: number;
  bookedSlots: number;
  availability: number;
}

// Admin API service
const adminService = {
  // Slot management
  createSlots: async (slots: SlotCreateRequest[]) => {
    const response = await axios.post(
      `${API_BASE_URL}/api/admin/slots`,
      { slots },
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  updateSlot: async (slotId: string, slotData: SlotCreateRequest) => {
    const response = await axios.put(
      `${API_BASE_URL}/api/admin/slots/${slotId}`,
      slotData,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  deleteSlot: async (slotId: string) => {
    const response = await axios.delete(
      `${API_BASE_URL}/api/admin/slots/${slotId}`,
      { headers: getAuthHeader() }
    );
    return response.data;
  },

  getAllSlots: async (filters?: {
    officeId?: string;
    dateFrom?: string;
    dateTo?: string;
    limit?: number;
    offset?: number;
  }) => {
    const response = await axios.get(
      `${API_BASE_URL}/api/admin/slots`,
      {
        headers: getAuthHeader(),
        params: filters
      }
    );
    return response.data;
  },

  // Analytics
  getBookingAnalytics: async (startDate?: string, endDate?: string) => {
    const response = await axios.get<BookingAnalytics>(
      `${API_BASE_URL}/api/admin/analytics/bookings`,
      {
        headers: getAuthHeader(),
        params: { startDate, endDate }
      }
    );
    return response.data;
  },

  getOfficeAnalytics: async () => {
    const response = await axios.get<{ offices: OfficeAnalytics[] }>(
      `${API_BASE_URL}/api/admin/analytics/offices`,
      { headers: getAuthHeader() }
    );
    return response.data;
  }
};

export default adminService;
