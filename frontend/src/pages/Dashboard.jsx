import React, { useState, useEffect } from 'react';
import axios from 'axios';
import AppointmentCard from '../components/AppointmentCard';

/**
 * Dashboard - Main dashboard page showing available appointment slots
 *
 * @component
 */
const Dashboard = () => {
  // State management
  const [appointmentSlots, setAppointmentSlots] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState({
    date: '',
    office: '',
  });

  // Fetch appointment slots from API
  useEffect(() => {
    const fetchAppointmentSlots = async () => {
      setLoading(true);
      setError(null);

      try {
        console.log('Fetching appointment slots...');
        // Replace with your actual API endpoint
        const response = await axios.get('/api/slots', {
          params: {
            date: filter.date || undefined,
            office: filter.office || undefined
          }
        });

        if (response.data && Array.isArray(response.data)) {
          console.log(`Retrieved ${response.data.length} appointment slots`);
          setAppointmentSlots(response.data);
        } else {
          throw new Error('Invalid data format received from API');
        }
      } catch (err) {
        console.error('Error fetching appointment slots:', err);
        setError('Failed to load appointment slots. Please try again later.');
        // Provide fallback data for development/testing
        setAppointmentSlots([
          {
            id: 1,
            date: '2023-12-15',
            time: '9:00 AM',
            office: { id: 1, name: 'Downtown Office' },
            available: true
          },
          {
            id: 2,
            date: '2023-12-15',
            time: '10:00 AM',
            office: { id: 1, name: 'Downtown Office' },
            available: true
          },
          {
            id: 3,
            date: '2023-12-16',
            time: '11:00 AM',
            office: { id: 2, name: 'Uptown Office' },
            available: false
          }
        ]);
      } finally {
        setLoading(false);
      }
    };

    fetchAppointmentSlots();
  }, [filter.date, filter.office]);

  // Handle slot selection
  const handleSelectSlot = (slot) => {
    if (!slot) {
      console.error('No slot provided to selection handler');
      return;
    }

    console.log('Selected slot:', slot);
    setSelectedSlot(slot);
    // Additional actions like opening a modal or navigating to booking page could go here
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilter(prevFilter => ({
      ...prevFilter,
      [name]: value
    }));
  };

  // Extract unique office options for filter
  const officeOptions = React.useMemo(() => {
    const offices = new Set();
    appointmentSlots.forEach(slot => {
      if (slot.office && slot.office.name) {
        offices.add(slot.office.name);
      }
    });
    return Array.from(offices);
  }, [appointmentSlots]);

  return (
    <div className="dashboard">
      <h1 className="dashboard__title">Available Appointment Slots</h1>

      {/* Filter controls */}
      <div className="dashboard__filters">
        <div className="filter-group">
          <label htmlFor="date-filter">Date:</label>
          <input
            id="date-filter"
            type="date"
            name="date"
            value={filter.date}
            onChange={handleFilterChange}
          />
        </div>

        <div className="filter-group">
          <label htmlFor="office-filter">Office:</label>
          <select
            id="office-filter"
            name="office"
            value={filter.office}
            onChange={handleFilterChange}
          >
            <option value="">All Offices</option>
            {officeOptions.map(office => (
              <option key={office} value={office}>
                {office}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Loading state */}
      {loading && (
        <div className="dashboard__loading" data-testid="loading-indicator">
          <p>Loading appointment slots...</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="dashboard__error" data-testid="error-message">
          <p>{error}</p>
          <button onClick={() => window.location.reload()}>Retry</button>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && appointmentSlots.length === 0 && (
        <div className="dashboard__empty" data-testid="empty-state">
          <p>No appointment slots available for the selected criteria.</p>
        </div>
      )}

      {/* Appointment slots grid */}
      {!loading && !error && appointmentSlots.length > 0 && (
        <div className="dashboard__slots-grid">
          {appointmentSlots.map((slot) => (
            <AppointmentCard
              key={slot.id}
              slot={slot}
              onSelect={handleSelectSlot}
              isSelected={selectedSlot && selectedSlot.id === slot.id}
              isDisabled={!slot.available}
            />
          ))}
        </div>
      )}

      {/* Selected slot information */}
      {selectedSlot && (
        <div className="dashboard__selected-slot">
          <h2>Selected Appointment</h2>
          <p>Date: {selectedSlot.date}</p>
          <p>Time: {selectedSlot.time}</p>
          <p>Office: {selectedSlot.office?.name || 'No office specified'}</p>
          <button
            className="btn btn-primary"
            onClick={() => {
              // Replace with actual booking logic
              console.log('Booking appointment:', selectedSlot);
              alert('Appointment booking functionality would go here');
            }}
          >
            Book Appointment
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
