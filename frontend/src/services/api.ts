import axios, { AxiosError, AxiosRequestConfig } from 'axios';
import { format } from 'date-fns';

const API_BASE_URL = '/api';

// Setup axios defaults
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor for handling errors
api.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    // Handle unauthorized errors
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const get = async <T>(url: string, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.get<T>(url, config);
  return response.data;
};

export const post = async <T>(url: string, data: any, config?: AxiosRequestConfig): Promise<T> => {
  const response = await api.post<T>(url, data, config);
  return response.data;
};

export interface ISlot {
  id: string;
  officeId: string;
  officeName: string;
  date: string;
  time: string;
  capacity: number;
  booked: number;
  available: number;
}

export interface IPaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
}

export interface ISlotSearchParams {
  location?: string;
  date?: Date;
  available?: number;
  limit?: number;
  offset?: number;
}

// Slots API
export const searchSlots = async (params: ISlotSearchParams = {}): Promise<IPaginatedResponse<ISlot>> => {
  try {
    // Format date to YYYY-MM-DD if provided
    const searchParams = new URLSearchParams();

    if (params.location) {
      searchParams.append('location', params.location);
    }

    if (params.date) {
      searchParams.append('date', format(params.date, 'yyyy-MM-dd'));
    }

    if (params.available !== undefined) {
      searchParams.append('available', params.available.toString());
    }

    if (params.limit) {
      searchParams.append('limit', params.limit.toString());
    }

    if (params.offset) {
      searchParams.append('offset', params.offset.toString());
    }

    const url = `/slots?${searchParams.toString()}`;
    const response = await api.get<IPaginatedResponse<ISlot>>(url);
    return response.data;
  } catch (error) {
    console.error('Error searching slots:', error);
    throw error;
  }
};

// Auth API
export const login = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};

export const register = async (email: string, password: string) => {
  try {
    const response = await api.post('/auth/register', { email, password });
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// Booking API
export const createBooking = async (slotId: string) => {
  try {
    const response = await api.post('/bookings', { slotId });
    return response.data;
  } catch (error) {
    console.error('Booking creation error:', error);
    throw error;
  }
};

export default api;
