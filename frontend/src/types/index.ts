// Authentication Types
export interface User {
  id: string;
  email: string;
  role: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: User;
}

// Slot Types
export interface Slot {
  id: string;
  officeId: string;
  officeName: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  capacity: number;
  booked: number;
  available: number;
}

export interface SlotFilters {
  location?: string;
  date?: string;
  available?: number;
  limit?: number;
  offset?: number;
}

export interface PaginationData {
  total: number;
  limit: number;
  offset: number;
}

export interface SlotsResponse {
  data: Slot[];
  pagination: PaginationData;
}

// Booking Types
export interface Booking {
  id: string;
  slotId: string;
  userId: string;
  reference: string;
  status: string;
  slot: {
    date: string;
    time: string;
    officeName: string;
  };
}
