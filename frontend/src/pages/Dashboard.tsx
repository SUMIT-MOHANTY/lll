import React, { useState, useEffect } from 'react';
import { Container, Typography, Box, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import AppointmentSearch, { SearchFilters } from '../components/dashboard/AppointmentSearch';
import AppointmentList from '../components/dashboard/AppointmentList';
import { getOffices, searchSlots } from '../services/appointmentService';

interface Slot {
  id: string;
  officeId: string;
  officeName: string;
  date: string;
  time: string;
  capacity: number;
  booked: number;
}

interface Location {
  id: string;
  name: string;
}

const Dashboard: React.FC = () => {
  // State
  const [slots, setSlots] = useState<Slot[]>([]);
  const [locations, setLocations] = useState<Location[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [openDialog, setOpenDialog] = useState<boolean>(false);

  // Default search filters
  const [activeFilters, setActiveFilters] = useState<SearchFilters>({
    location: '',
    date: null,
    minAvailable: 1,
  });

  const LIMIT = 12; // Items per page

  // Load offices on component mount
  useEffect(() => {
    const fetchOffices = async () => {
      try {
        const officeData = await getOffices();
        setLocations(officeData);
      } catch (err) {
        setError('Failed to load office locations. Please try again later.');
      }
    };

    fetchOffices();
    // Initial slot search
    handleSearch(activeFilters);
  }, []);

  const handleSearch = async (filters: SearchFilters) => {
    setLoading(true);
    setError(null);
    setActiveFilters(filters);
    setPage(1); // Reset to first page on new search

    try {
      const formattedDate = filters.date
        ? filters.date.toISOString().split('T')[0]
        : undefined;

      const response = await searchSlots({
        location: filters.location || undefined,
        date: formattedDate,
        available: filters.minAvailable,
        limit: LIMIT,
        offset: 0
      });

      setSlots(response.data);
      setTotalPages(Math.ceil(response.total / LIMIT));
    } catch (err) {
      setError('Failed to fetch appointments. Please try again later.');
      setSlots([]);
    } finally {
      setLoading(false);
    }
  };

  const handlePageChange = async (newPage: number) => {
    setLoading(true);
    setError(null);
    setPage(newPage);

    try {
      const formattedDate = activeFilters.date
        ? activeFilters.date.toISOString().split('T')[0]
        : undefined;

      const response = await searchSlots({
        location: activeFilters.location || undefined,
        date: formattedDate,
        available: activeFilters.minAvailable,
        limit: LIMIT,
        offset: (newPage - 1) * LIMIT
      });

      setSlots(response.data);
    } catch (err) {
      setError('Failed to fetch appointments. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSlot = (slotId: string) => {
    setSelectedSlot(slotId);
    setOpenDialog(true);
  };

  const handleBookSlot = () => {
    // This would typically call a booking API
    // For now, we'll just close the dialog
    setOpenDialog(false);
    // Here you would navigate to booking confirmation page or show success message
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 8 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Book Passport Appointment
      </Typography>

      <Box mt={4}>
        <AppointmentSearch
          locations={locations}
          onSearch={handleSearch}
          loading={loading}
        />

        <Box mt={4}>
          <AppointmentList
            slots={slots}
            loading={loading}
            error={error}
            onSelectSlot={handleSelectSlot}
            page={page}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </Box>
      </Box>

      {/* Slot selection dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)}>
        <DialogTitle>Confirm Appointment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to book this appointment slot?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            {selectedSlot && slots.find(s => s.id === selectedSlot)?.officeName} on{' '}
            {selectedSlot && new Date(slots.find(s => s.id === selectedSlot)?.date || '').toLocaleDateString()} at{' '}
            {selectedSlot && slots.find(s => s.id === selectedSlot)?.time}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button onClick={handleBookSlot} variant="contained" color="primary">
            Book Appointment
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Dashboard;
