import { renderHook, act } from '@testing-library/react-hooks';
import useSlots from '../../../src/hooks/useSlots';
import { vi } from 'vitest';

// Mock react-router-dom
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/', search: '?location=loc1&date=2023-01-01' }),
  useNavigate: () => vi.fn(),
}));

// Mock fetch API
global.fetch = vi.fn();

describe('useSlots Hook', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock successful API response
    global.fetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({
        data: [
          { id: 'slot1', officeId: 'loc1', officeName: 'London', date: '2023-01-01', time: '09:00' },
          { id: 'slot2', officeId: 'loc1', officeName: 'London', date: '2023-01-01', time: '10:00' },
        ],
        pagination: { total: 2, limit: 20, offset: 0 },
      }),
    });
  });

  test('fetches slots with initial filters', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSlots({
      initialLocation: 'loc1',
      initialDate: '2023-01-01',
    }));

    // Initial state before data is loaded
    expect(result.current.loading).toBe(true);
    expect(result.current.slots).toEqual([]);

    await waitForNextUpdate();

    // After data is loaded
    expect(result.current.loading).toBe(false);
    expect(result.current.slots).toHaveLength(2);
    expect(result.current.totalSlots).toBe(2);
    expect(result.current.filters).toEqual({
      location: 'loc1',
      date: '2023-01-01',
      limit: 20,
      offset: 0,
    });

    // Verify API was called with correct params
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/slots?location=loc1&date=2023-01-01&limit=20&offset=0')
    );
  });

  test('updates filters and refetches data', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSlots());

    await waitForNextUpdate();

    // Update filters
    act(() => {
      result.current.updateFilters({ location: 'loc2' });
    });

    // Should be loading again
    expect(result.current.loading).toBe(true);

    await waitForNextUpdate();

    // Verify filters were updated
    expect(result.current.filters.location).toBe('loc2');

    // Verify API was called with new params
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('/api/slots?location=loc2&limit=20&offset=0')
    );
  });

  test('handles API errors correctly', async () => {
    // Mock API failure
    global.fetch.mockResolvedValue({
      ok: false,
      status: 500,
      statusText: 'Server Error',
    });

    const { result, waitForNextUpdate } = renderHook(() => useSlots());

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeTruthy();
    expect(result.current.slots).toEqual([]);
  });

  test('resets filters correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSlots({
      initialLocation: 'loc1',
      initialDate: '2023-01-01',
    }));

    await waitForNextUpdate();

    act(() => {
      result.current.resetFilters();
    });

    await waitForNextUpdate();

    expect(result.current.filters).toEqual({
      location: '',
      date: '',
      limit: 20,
      offset: 0,
    });
  });

  test('pagination works correctly', async () => {
    const { result, waitForNextUpdate } = renderHook(() => useSlots({
      limit: 10,
    }));

    await waitForNextUpdate();

    act(() => {
      result.current.goToPage(2); // Go to page 3 (zero-based index)
    });

    await waitForNextUpdate();

    expect(result.current.filters.offset).toBe(20); // 2 * 10
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringContaining('offset=20')
    );
  });
});
