import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { Box, FormControl, FormLabel, Select, Input, Flex, Button, Text, Spinner } from '@chakra-ui/react';

/**
 * SlotFilters Component
 *
 * This component provides filters for location and date to filter appointment slots
 * in the Passport Office Appointment Booking System dashboard.
 */
const SlotFilters = ({
  onFilterChange,
  initialLocation = '',
  initialDate = '',
  isLoading = false,
  locations = [],
  onReset
}) => {
  const [location, setLocation] = useState(initialLocation);
  const [date, setDate] = useState(initialDate);
  const [dateError, setDateError] = useState('');
  const dateDebounceTimer = useRef(null);

  // Initialize with provided values
  useEffect(() => {
    setLocation(initialLocation);
    setDate(initialDate);
  }, [initialLocation, initialDate]);

  // Handle location change
  const handleLocationChange = (e) => {
    const newLocation = e.target.value;
    setLocation(newLocation);

    // Log for debugging
    console.debug('Location filter changed:', newLocation);

    onFilterChange({ location: newLocation, date });
  };

  // Validate date format
  const validateDate = (dateStr) => {
    if (!dateStr) return true;

    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return false;
    }

    const parsedDate = new Date(dateStr);
    return !isNaN(parsedDate.getTime());
  };

  // Handle date change with debounce
  const handleDateChange = (e) => {
    const newDate = e.target.value;
    setDate(newDate);

    // Clear any existing timer
    if (dateDebounceTimer.current) {
      clearTimeout(dateDebounceTimer.current);
    }

    // Validate the date
    if (newDate && !validateDate(newDate)) {
      setDateError('Invalid date format. Please use YYYY-MM-DD');
      return;
    } else {
      setDateError('');
    }

    // Set a new timer for debounce
    dateDebounceTimer.current = setTimeout(() => {
      console.debug('Date filter changed (debounced):', newDate);
      onFilterChange({ location, date: newDate });
    }, 300);
  };

  // Clear the debounce timer on unmount
  useEffect(() => {
    return () => {
      if (dateDebounceTimer.current) {
        clearTimeout(dateDebounceTimer.current);
      }
    };
  }, []);

  // Handle filter reset
  const handleReset = () => {
    setLocation('');
    setDate('');
    setDateError('');

    // Notify parent component
    if (onReset) {
      onReset();
    } else {
      onFilterChange({ location: '', date: '' });
    }
  };

  return (
    <Box p={4} bg="white" borderRadius="md" shadow="sm" mb={4}>
      <Flex direction={{ base: 'column', md: 'row' }} gap={4} align="flex-end">
        <FormControl flex={1}>
          <FormLabel htmlFor="location">Office Location</FormLabel>
          <Select
            id="location"
            value={location}
            onChange={handleLocationChange}
            placeholder="All Locations"
            disabled={isLoading}
          >
            {locations.map((loc) => (
              <option key={loc.id || loc} value={loc.id || loc}>
                {loc.name || loc}
              </option>
            ))}
          </Select>
        </FormControl>

        <FormControl flex={1}>
          <FormLabel htmlFor="date">Appointment Date</FormLabel>
          <Input
            id="date"
            type="date"
            value={date}
            onChange={handleDateChange}
            disabled={isLoading}
            isInvalid={!!dateError}
          />
          {dateError && <Text color="red.500" fontSize="sm">{dateError}</Text>}
        </FormControl>

        <Button
          onClick={handleReset}
          variant="outline"
          colorScheme="blue"
          disabled={isLoading}
        >
          Reset
        </Button>

        {isLoading && (
          <Spinner size="sm" color="blue.500" ml={2} />
        )}
      </Flex>
    </Box>
  );
};

SlotFilters.propTypes = {
  onFilterChange: PropTypes.func.isRequired,
  initialLocation: PropTypes.string,
  initialDate: PropTypes.string,
  isLoading: PropTypes.bool,
  locations: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired
      })
    ])
  ),
  onReset: PropTypes.func
};

export default SlotFilters;
