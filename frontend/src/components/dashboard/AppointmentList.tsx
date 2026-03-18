import React from 'react';
import { Grid, Typography, Box, CircularProgress, Alert, Pagination } from '@mui/material';
import AppointmentCard from './AppointmentCard';

interface Slot {
  id: string;
  officeId: string;
  officeName: string;
  date: string;  // YYYY-MM-DD
  time: string;  // HH:MM
  capacity: number;
  booked: number;
}

interface AppointmentListProps {
  slots: Slot[];
  loading: boolean;
  error: string | null;
  onSelectSlot: (slotId: string) => void;
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const AppointmentList: React.FC<AppointmentListProps> = ({
  slots,
  loading,
  error,
  onSelectSlot,
  page,
  totalPages,
  onPageChange,
}) => {
  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error" sx={{ mb: 2 }}>
        {error}
      </Alert>
    );
  }

  if (slots.length === 0) {
    return (
      <Box textAlign="center" py={4}>
        <Typography variant="h6" color="text.secondary">
          No appointments available matching your criteria.
        </Typography>
        <Typography color="text.secondary">
          Try adjusting your search filters or selecting a different date.
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Grid container spacing={2}>
        {slots.map((slot) => (
          <Grid item xs={12} sm={6} md={4} key={slot.id}>
            <AppointmentCard slot={slot} onSelect={onSelectSlot} />
          </Grid>
        ))}
      </Grid>

      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, value) => onPageChange(value)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default AppointmentList;
