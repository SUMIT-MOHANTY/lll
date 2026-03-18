import { useState, useEffect, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

/**
 * Custom hook for fetching and filtering slot data
 *
 * Manages URL parameters for location and date filters
 * Fetches data from the API with those filters
 * Updates the URL when filters change
 * Provides loading and error states
 */
const useSlots = (options = {}) => {
  const {
    initialLocation = '',
    initialDate = '',
    limit = 20,
    offset = 0,
  } = options;

  // State for data, loading, and error
  const [slots, setSlots] = useState([]);
  const [totalSlots, setTotalSlots] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [locations, setLocations] = useState([]);

  // State for filters
  const [filters, setFilters] = useState({
    location: initialLocation,
    date: initialDate,
    limit,
    offset,
  });

  // Router hooks for URL management
  const location = useLocation();
  const navigate = useNavigate();

  // Initialize filters from URL on first load
  useEffect(() => {
    const searchParams = new URLSearchParams(location.search);

    // Get filters from URL or use defaults
    const locationParam = searchParams.get('location') || initialLocation;
    const dateParam = searchParams.get('date') || initialDate;
    const limitParam = parseInt(searchParams.get('limit') || limit, 10);
    const offsetParam = parseInt(searchParams.get('offset') || offset, 10);

    setFilters({
      location: locationParam,
      date: dateParam,
      limit: limitParam,
      offset: offsetParam,
    });

    // Also fetch available locations on component mount
    fetchLocations();
  }, []);

  // Update URL when filters change
  useEffect(() => {
    const searchParams = new URLSearchParams();

    if (filters.location) searchParams.set('location', filters.location);
    if (filters.date) searchParams.set('date', filters.date);
    if (filters.limit !== 20) searchParams.set('limit', filters.limit.toString());
    if (filters.offset !== 0) searchParams.set('offset', filters.offset.toString());

    // Update URL without causing a reload
    const newSearch = searchParams.toString();
    const newPath = `${location.pathname}${newSearch ? `?${newSearch}` : ''}`;

    navigate(newPath, { replace: true });

    // Fetch data with new filters
    fetchSlots();
  }, [filters]);

  // Fetch slots from API
  const fetchSlots = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Build query string from filters
      const searchParams = new URLSearchParams();
      if (filters.location) searchParams.set('location', filters.location);
      if (filters.date) searchParams.set('date', filters.date);
      searchParams.set('limit', filters.limit.toString());
      searchParams.set('offset', filters.offset.toString());

      // Fetch data
      console.debug('Fetching slots with params:', Object.fromEntries(searchParams.entries()));
      const response = await fetch(`/api/slots?${searchParams.toString()}`);

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      setSlots(data.data || []);
      setTotalSlots(data.pagination?.total || 0);
    } catch (err) {
      console.error('Error fetching slots:', err);
      setError(err.message || 'Failed to fetch appointment slots');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  // Fetch available locations
  const fetchLocations = useCallback(async () => {
    try {
      const response = await fetch('/api/offices');

      if (!response.ok) {
        throw new Error(`API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      setLocations(data.data || []);
    } catch (err) {
      console.error('Error fetching locations:', err);
      // Don't set the main error state, as this is supplementary data
    }
  }, []);

  // Update filters
  const updateFilters = useCallback((newFilters) => {
    setFilters(prevFilters => ({
      ...prevFilters,
      ...newFilters,
      // Reset offset when changing filters
      offset: newFilters.location !== undefined || newFilters.date !== undefined ? 0 : prevFilters.offset
    }));
  }, []);

  // Handle pagination
  const goToPage = useCallback((page) => {
    const newOffset = page * filters.limit;
    updateFilters({ offset: newOffset });
  }, [filters.limit, updateFilters]);

  // Reset all filters
  const resetFilters = useCallback(() => {
    setFilters({
      location: '',
      date: '',
      limit,
      offset: 0,
    });
  }, [limit]);

  return {
    slots,
    totalSlots,
    loading,
    error,
    filters,
    locations,
    updateFilters,
    resetFilters,
    goToPage,
    pagination: {
      limit: filters.limit,
      offset: filters.offset,
      total: totalSlots,
      currentPage: Math.floor(filters.offset / filters.limit),
      totalPages: Math.ceil(totalSlots / filters.limit) || 1,
    }
  };
};

export default useSlots;
