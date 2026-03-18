import axios from 'axios';

const API_URL = '/api';

interface SlotSearchParams {
  location?: string;
  date?: string;
  available?: number;
  limit?: number;
  offset?: number;
}

interface SlotResponse {
  data: Array<{
    id: string;
    officeId: string;
    officeName: string;
    date: string;
    time: string;
    capacity: number;
    booked: number;
  }>;
  total: number;
  limit: number;
  offset: number;
}

interface Office {
  id: string;
  name: string;
  address: string;
  city: string;
}

// Get all office locations
export const getOffices = async (): Promise<Array<{ id: string; name: string }>> => {
  try {
    const response = await axios.get(`${API_URL}/offices`);
    return response.data.map((office: Office) => ({
      id: office.id,
      name: office.name
    }));
  } catch (error) {
    console.error('Error fetching offices:', error);
    throw new Error('Failed to fetch office locations');
  }
};

// Search for available slots with filtering
export const searchSlots = async (params: SlotSearchParams): Promise<SlotResponse> => {
  try {
    // Build query parameters
    const queryParams = new URLSearchParams();

    if (params.location) queryParams.append('location', params.location);
    if (params.date) queryParams.append('date', params.date);
    if (params.available) queryParams.append('available', params.available.toString());
    if (params.limit) queryParams.append('limit', params.limit.toString());
    if (params.offset) queryParams.append('offset', params.offset.toString());

    const response = await axios.get(`${API_URL}/slots?${queryParams.toString()}`);

    return response.data;
  } catch (error) {
    console.error('Error searching slots:', error);
    throw new Error('Failed to search appointment slots');
  }
};

// Book a specific slot
export const bookSlot = async (slotId: string): Promise<any> => {
  try {
    const response = await axios.post(`${API_URL}/bookings`, {
      slotId
    });
    return response.data;
  } catch (error) {
    console.error('Error booking slot:', error);
    throw new Error('Failed to book appointment slot');
  }
};
