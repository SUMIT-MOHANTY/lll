import React from 'react';
import { Box, Heading, Text, SimpleGrid, Container } from '@chakra-ui/react';
import SlotFilters from '../components/SlotFilters';
import useSlots from '../hooks/useSlots';
import AppointmentCard from '../components/AppointmentCard';

/**
 * Dashboard Page
 * Example implementation showing how to use SlotFilters and useSlots
 */
const DashboardExample = () => {
  // Use the slots hook to fetch and filter data
  const {
    slots,
    loading,
    error,
    filters,
    locations,
    updateFilters,
    resetFilters,
  } = useSlots();

  // Handle filter changes
  const handleFilterChange = (newFilters) => {
    updateFilters(newFilters);
  };

  return (
    <Container maxW="container.xl" py={6}>
      <Heading as="h1" mb={6}>Passport Office Appointments</Heading>

      {/* Slot Filters */}
      <SlotFilters
        onFilterChange={handleFilterChange}
        initialLocation={filters.location}
        initialDate={filters.date}
        isLoading={loading}
        locations={locations}
        onReset={resetFilters}
      />

      {/* Error Message */}
      {error && (
        <Box bg="red.50" p={4} borderRadius="md" color="red.600" mb={4}>
          <Text>{error}</Text>
        </Box>
      )}

      {/* Slots Grid */}
      {loading ? (
        <Text>Loading appointments...</Text>
      ) : slots.length > 0 ? (
        <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
          {slots.map(slot => (
            <AppointmentCard key={slot.id} slot={slot} />
          ))}
        </SimpleGrid>
      ) : (
        <Text>No appointment slots available with the current filters.</Text>
      )}
    </Container>
  );
};

export default DashboardExample;
