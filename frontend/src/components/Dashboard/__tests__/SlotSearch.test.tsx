import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import SlotSearch from '../SlotSearch';

// Mock the DatePicker component since it's complex to test
jest.mock('react-datepicker', () => {
  const MockDatePicker = ({ onChange, selected }: any) => (
    <input
      data-testid="date-picker"
      onChange={(e) => onChange(new Date(e.target.value))}
      value={selected ? selected.toISOString().split('T')[0] : ''}
      type="date"
    />
  );
  return MockDatePicker;
});

describe('SlotSearch Component', () => {
  const mockOnSearch = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the search form correctly', () => {
    render(
      <ChakraProvider>
        <SlotSearch onSearch={mockOnSearch} isLoading={false} />
      </ChakraProvider>
    );

    expect(screen.getByText('Find Available Appointments')).toBeInTheDocument();
    expect(screen.getByText('Office Location')).toBeInTheDocument();
    expect(screen.getByText('Date')).toBeInTheDocument();
    expect(screen.getByText('Minimum Available Spots')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /search/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /clear filters/i })).toBeInTheDocument();
  });

  test('submits search with correct parameters', async () => {
    render(
      <ChakraProvider>
        <SlotSearch onSearch={mockOnSearch} isLoading={false} />
      </ChakraProvider>
    );

    // Select a location
    const locationSelect = screen.getByPlaceholderText('Select location');
    fireEvent.change(locationSelect, { target: { value: 'London' } });

    // Select a date
    const datePicker = screen.getByTestId('date-picker');
    fireEvent.change(datePicker, { target: { value: '2023-12-25' } });

    // Input min available spots
    const minAvailableInput = screen.getByPlaceholderText('Enter minimum available spots');
    fireEvent.change(minAvailableInput, { target: { value: '2' } });

    // Click search button
    const searchButton = screen.getByRole('button', { name: /search/i });
    fireEvent.click(searchButton);

    await waitFor(() => {
      expect(mockOnSearch).toHaveBeenCalledWith({
        location: 'London',
        date: expect.any(Date),
        available: 2
      });
    });
  });

  test('clear filters resets form and calls onSearch with empty params', () => {
    render(
      <ChakraProvider>
        <SlotSearch onSearch={mockOnSearch} isLoading={false} />
      </ChakraProvider>
    );

    // First set some values
    const locationSelect = screen.getByPlaceholderText('Select location');
    fireEvent.change(locationSelect, { target: { value: 'London' } });

    // Clear filters
    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    fireEvent.click(clearButton);

    expect(mockOnSearch).toHaveBeenCalledWith({});
    expect(locationSelect).toHaveValue('');
  });

  test('disables buttons when loading', () => {
    render(
      <ChakraProvider>
        <SlotSearch onSearch={mockOnSearch} isLoading={true} />
      </ChakraProvider>
    );

    const searchButton = screen.getByRole('button', { name: /searching/i });
    expect(searchButton).toHaveAttribute('disabled');

    const clearButton = screen.getByRole('button', { name: /clear filters/i });
    expect(clearButton).toHaveAttribute('disabled');
  });
});
