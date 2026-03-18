import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import BookSlot from '../BookSlot';
import { bookSlot } from '../../services/booking';

// Mock the booking service
jest.mock('../../services/booking', () => ({
  bookSlot: jest.fn()
}));

describe('BookSlot Component', () => {
  const mockSlotId = '123e4567-e89b-12d3-a456-426614174000';
  const mockOnSuccess = jest.fn();
  const mockOnError = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders the booking button', () => {
    render(<BookSlot slotId={mockSlotId} />);
    expect(screen.getByTestId('book-slot-button')).toBeInTheDocument();
    expect(screen.getByTestId('book-slot-button')).toHaveTextContent('Book Appointment');
  });

  test('shows confirmation dialog when button is clicked', () => {
    render(<BookSlot slotId={mockSlotId} />);
    fireEvent.click(screen.getByTestId('book-slot-button'));
    expect(screen.getByText('Confirm Booking')).toBeInTheDocument();
    expect(screen.getByText('Are you sure you want to book this appointment slot?')).toBeInTheDocument();
  });

  test('closes dialog when cancel is clicked', () => {
    render(<BookSlot slotId={mockSlotId} />);
    fireEvent.click(screen.getByTestId('book-slot-button'));
    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText('Confirm Booking')).not.toBeInTheDocument();
  });

  test('calls bookSlot service when confirmed', async () => {
    // Mock successful response
    bookSlot.mockResolvedValueOnce({
      success: true,
      data: { reference: 'REF123' },
      message: 'Appointment booked successfully'
    });

    render(<BookSlot slotId={mockSlotId} onSuccess={mockOnSuccess} />);

    fireEvent.click(screen.getByTestId('book-slot-button'));
    fireEvent.click(screen.getByTestId('confirm-booking-button'));

    await waitFor(() => {
      expect(bookSlot).toHaveBeenCalledWith(mockSlotId);
      expect(mockOnSuccess).toHaveBeenCalledTimes(1);
    });
  });

  test('shows error message when booking fails', async () => {
    // Mock error response
    bookSlot.mockResolvedValueOnce({
      success: false,
      error: 'This slot is already booked',
      code: 'CONFLICT'
    });

    render(<BookSlot slotId={mockSlotId} onError={mockOnError} />);

    fireEvent.click(screen.getByTestId('book-slot-button'));
    fireEvent.click(screen.getByTestId('confirm-booking-button'));

    await waitFor(() => {
      expect(screen.getByTestId('booking-error')).toHaveTextContent('This slot is already booked');
      expect(mockOnError).toHaveBeenCalledTimes(1);
    });
  });

  test('button is disabled when disabled prop is true', () => {
    render(<BookSlot slotId={mockSlotId} disabled={true} />);
    expect(screen.getByTestId('book-slot-button')).toBeDisabled();
  });

  test('custom button text is displayed', () => {
    render(<BookSlot slotId={mockSlotId} buttonText="Reserve Now" />);
    expect(screen.getByTestId('book-slot-button')).toHaveTextContent('Reserve Now');
  });
});
