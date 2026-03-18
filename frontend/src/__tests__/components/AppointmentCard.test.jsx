import React from 'react';
import { render, fireEvent, screen } from '@testing-library/react';
import AppointmentCard from '../../components/AppointmentCard';

describe('AppointmentCard Component', () => {
  const mockSlot = {
    id: 1,
    date: '2023-12-15',
    time: '9:00 AM',
    office: { id: 1, name: 'Downtown Office' }
  };

  const mockOnSelect = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('renders appointment details correctly', () => {
    render(<AppointmentCard slot={mockSlot} onSelect={mockOnSelect} />);

    expect(screen.getByText('December 15, 2023')).toBeInTheDocument();
    expect(screen.getByText('9:00 AM')).toBeInTheDocument();
    expect(screen.getByText('Downtown Office')).toBeInTheDocument();
    expect(screen.getByText('Available')).toBeInTheDocument();
  });

  test('calls onSelect when clicked', () => {
    render(<AppointmentCard slot={mockSlot} onSelect={mockOnSelect} />);

    fireEvent.click(screen.getByTestId('appointment-card'));
    expect(mockOnSelect).toHaveBeenCalledWith(mockSlot);
  });

  test('does not call onSelect when disabled', () => {
    render(<AppointmentCard slot={mockSlot} onSelect={mockOnSelect} isDisabled={true} />);

    fireEvent.click(screen.getByTestId('appointment-card'));
    expect(mockOnSelect).not.toHaveBeenCalled();
  });

  test('applies selected class when selected', () => {
    const { container } = render(
      <AppointmentCard slot={mockSlot} onSelect={mockOnSelect} isSelected={true} />
    );

    expect(container.firstChild).toHaveClass('appointment-card--selected');
  });

  test('applies disabled class when disabled', () => {
    const { container } = render(
      <AppointmentCard slot={mockSlot} onSelect={mockOnSelect} isDisabled={true} />
    );

    expect(container.firstChild).toHaveClass('appointment-card--disabled');
  });

  test('shows fallback for invalid slot data', () => {
    render(<AppointmentCard slot={null} onSelect={mockOnSelect} />);
    expect(screen.getByText('Invalid slot data')).toBeInTheDocument();
  });
});
