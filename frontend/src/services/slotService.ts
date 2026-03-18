import { get } from './api';
import { SlotsResponse, SlotFilters } from '../types';

export const getSlots = async (filters?: SlotFilters): Promise<SlotsResponse> => {
  // Convert filters to query parameters
  const params = new URLSearchParams();

  if (filters) {
    if (filters.location) params.append('location', filters.location);
    if (filters.date) params.append('date', filters.date);
    if (filters.available) params.append('available', filters.available.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
  }

  const queryString = params.toString() ? `?${params.toString()}` : '';
  return await get<SlotsResponse>(`/slots${queryString}`);
};
