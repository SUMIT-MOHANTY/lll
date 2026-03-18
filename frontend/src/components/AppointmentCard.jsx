import React from 'react';
import { format } from 'date-fns';
import PropTypes from 'prop-types';

/**
 * AppointmentCard - Component to display appointment slot information
 *
 * @component
 * @param {Object} props - Component props
 * @param {Object} props.slot - Appointment slot data
 * @param {Function} props.onSelect - Function to call when slot is selected
 * @param {boolean} props.isSelected - Whether this slot is currently selected
 * @param {boolean} props.isDisabled - Whether this slot is disabled
 */
const AppointmentCard = ({ slot, onSelect, isSelected = false, isDisabled = false }) => {
  if (!slot) {
    console.error('AppointmentCard: No slot data provided');
    return <div className="appointment-card appointment-card--error">Invalid slot data</div>;
  }

  const handleSelect = () => {
    if (isDisabled) {
      console.log('This appointment slot is not available');
      return;
    }

    try {
      onSelect(slot);
    } catch (error) {
      console.error('Error selecting appointment slot:', error);
    }
  };

  const formattedDate = slot.date ? format(new Date(slot.date), 'MMMM d, yyyy') : 'Invalid date';
  const formattedTime = slot.time || 'No time specified';

  return (
    <div
      className={`appointment-card ${isSelected ? 'appointment-card--selected' : ''}
                ${isDisabled ? 'appointment-card--disabled' : ''}`}
      onClick={handleSelect}
      data-testid="appointment-card"
    >
      <div className="appointment-card__date">{formattedDate}</div>
      <div className="appointment-card__time">{formattedTime}</div>
      <div className="appointment-card__office">{slot.office?.name || 'Office not specified'}</div>
      <div className="appointment-card__availability">
        {isDisabled ? 'Not Available' : 'Available'}
      </div>
    </div>
  );
};

AppointmentCard.propTypes = {
  slot: PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    date: PropTypes.string.isRequired,
    time: PropTypes.string.isRequired,
    office: PropTypes.shape({
      id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
      name: PropTypes.string,
    })
  }),
  onSelect: PropTypes.func.isRequired,
  isSelected: PropTypes.bool,
  isDisabled: PropTypes.bool
};

export default AppointmentCard;
