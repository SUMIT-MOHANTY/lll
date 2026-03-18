import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { ChakraProvider } from '@chakra-ui/react';
import SlotList from '../SlotList';
import { ISlot } from '../../../services/api';

// Mock date-fns to avoid format issues in tests
jest.mock('date-fns', () => ({
  format: jest.fn().mockImplementation(() => 'Dec 25, 2023'),
}));

describe('SlotList Component', () => {
  const mockOnBookSlot = jest.fn();
  const mockOnPageChange = jest.fn();

  const mockSlots: ISlot[] = [
    {
      id: '1',
      officeId: 'office-1',
      officeName: 'London',
      date: '2023-12-25',
      time: '10:00',
      capacity: 10,
      booked: 5,
      available: 5
    },
    {
      id: '2',
      officeId: 'office-2',
      officeName: 'Manchester',
      date: '2023-12-26',
      time: '14:30',
      capacity: 8,
      booked: 7,
      available: 1
    }
  ];

  const mockPagination = {
    total: 10,
    limit: 5,
    offset: 0
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders loading spinner when isLoading is true', () => {
    render(
      <ChakraProvider>
        <SlotList
          slots={[]}
          isLoading={true}
          error={null}
          onBookSlot={mockOnBookSlot}
          pagination={mockPagination}
          onPageChange={mockOnPageChange}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  test('renders error message when error is provided', () => {
    render(
      <ChakraProvider>
        <SlotList
          slots={[]}
          isLoading={false}
          error="Failed to load slots"
          onBookSlot={mockOnBookSlot}
          pagination={mockPagination}
          onPageChange={mockOnPageChange}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Error loading slots!')).toBeInTheDocument();
    expect(screen.getByText('Failed to load slots')).toBeInTheDocument();
  });

  test('renders no slots message when slots array is empty', () => {
    render(
      <ChakraProvider>
        <SlotList
          slots={[]}
          isLoading={false}
          error={null}
          onBookSlot={mockOnBookSlot}
          pagination={mockPagination}
          onPageChange={mockOnPageChange}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('No slots found')).toBeInTheDocument();
  });

  test('renders slot list with correct data', () => {
    render(
      <ChakraProvider>
        <SlotList
          slots={mockSlots}
          isLoading={false}
          error={null}
          onBookSlot={mockOnBookSlot}
          pagination={mockPagination}
          onPageChange={mockOnPageChange}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('London')).toBeInTheDocument();
    expect(screen.getByText('Manchester')).toBeInTheDocument();
    expect(screen.getByText('10:00')).toBeInTheDocument();
    expect(screen.getByText('14:30')).toBeInTheDocument();
    expect(screen.getByText('5 / 10')).toBeInTheDocument();
    expect(screen.getByText('1 / 8')).toBeInTheDocument();
    expect(screen.getAllByText('Book').length).toBe(2);
  });

  test('calls onBookSlot when Book button is clicked', () => {
    render(
      <ChakraProvider>
        <SlotList
          slots={mockSlots}
          isLoading={false}
          error={null}
          onBookSlot={mockOnBookSlot}
          pagination={mockPagination}
          onPageChange={mockOnPageChange}
        />
      </ChakraProvider>
    );

    const bookButtons = screen.getAllByText('Book');
    fireEvent.click(bookButtons[0]);

    expect(mockOnBookSlot).toHaveBeenCalledWith(mockSlots[0]);
  });

  test('pagination controls work correctly', () => {
    render(
      <ChakraProvider>
        <SlotList
          slots={mockSlots}
          isLoading={false}
          error={null}
          onBookSlot={mockOnBookSlot}
          pagination={mockPagination}
          onPageChange={mockOnPageChange}
        />
      </ChakraProvider>
    );

    expect(screen.getByText('Page 1 of 2')).toBeInTheDocument();

    // Click next page
    const nextButton = screen.getByText('Next');
    fireEvent.click(nextButton);
    expect(mockOnPageChange).toHaveBeenCalledWith(5);

    // Previous button should be disabled on first page
    const prevButton = screen.getByText('Previous');
    expect(prevButton).toHaveAttribute('disabled');
  });
});
