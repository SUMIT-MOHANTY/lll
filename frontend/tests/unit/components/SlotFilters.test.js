import { render, screen, fireEvent, act } from '@testing-library/react';
import SlotFilters from '../../../src/components/SlotFilters';
import { vi } from 'vitest';

// Mock setTimeout and clearTimeout
vi.useFakeTimers();

describe('SlotFilters Component', () => {
  const mockOnFilterChange = vi.fn();
  const mockOnReset = vi.fn();
  const mockLocations = [
    { id: 'loc1', name: 'London' },
    { id: 'loc2', name: 'Manchester' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('renders with initial values', () => {
    render(
      <SlotFilters
        onFilterChange={mockOnFilterChange}
        initialLocation="loc1"
        initialDate="2023-01-01"
        locations={mockLocations}
      />
    );

    expect(screen.getByLabelText(/office location/i).value).toBe('loc1');
    expect(screen.getByLabelText(/appointment date/i).value).toBe('2023-01-01');
  });

  test('location change triggers filter update', () => {
    render(
      <SlotFilters
        onFilterChange={mockOnFilterChange}
        locations={mockLocations}
      />
    );

    fireEvent.change(screen.getByLabelText(/office location/i), {
      target: { value: 'loc2' },
    });

    expect(mockOnFilterChange).toHaveBeenCalledWith({
      location: 'loc2',
      date: '',
    });
  });

  test('date change triggers debounced filter update', async () => {
    render(
      <SlotFilters
        onFilterChange={mockOnFilterChange}
        locations={mockLocations}
      />
    );

    fireEvent.change(screen.getByLabelText(/appointment date/i), {
      target: { value: '2023-02-15' },
    });

    // The callback should not be called immediately due to debounce
    expect(mockOnFilterChange).not.toHaveBeenCalled();

    // Fast-forward timers
    act(() => {
      vi.runAllTimers();
    });

    // Now the callback should be called
    expect(mockOnFilterChange).toHaveBeenCalledWith({
      location: '',
      date: '2023-02-15',
    });
  });

  test('reset button clears filters', () => {
    render(
      <SlotFilters
        onFilterChange={mockOnFilterChange}
        onReset={mockOnReset}
        initialLocation="loc1"
        initialDate="2023-01-01"
        locations={mockLocations}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /reset/i }));
    expect(mockOnReset).toHaveBeenCalled();
  });

  test('shows error for invalid date format', () => {
    render(
      <SlotFilters
        onFilterChange={mockOnFilterChange}
        locations={mockLocations}
      />
    );

    // Date inputs normally validate format, but we'll force an invalid value
    const dateInput = screen.getByLabelText(/appointment date/i);
    fireEvent.change(dateInput, { target: { value: 'invalid-date' } });

    expect(screen.getByText(/invalid date format/i)).toBeInTheDocument();

    // Fast-forward timers to ensure debounce doesn't trigger for invalid date
    act(() => {
      vi.runAllTimers();
    });

    // The filter change callback should not be called for invalid date
    expect(mockOnFilterChange).not.toHaveBeenCalled();
  });
});
