import React from 'react';
import { Box, Card, CardContent, Typography, Chip, Stack } from '@mui/material';

interface Slot {
  id: string;
  officeId: string;
  officeName: string;
  date: string;  // YYYY-MM-DD
  time: string;  // HH:MM
  capacity: number;
  booked: number;
}

interface AppointmentCardProps {
  slot: Slot;
  onSelect: (slotId: string) => void;
}

const AppointmentCard: React.FC<AppointmentCardProps> = ({ slot, onSelect }) => {
  const availableSpots = slot.capacity - slot.booked;
  const availabilityColor = availableSpots > 5
    ? 'success'
    : availableSpots > 0
      ? 'warning'
      : 'error';

  // Format the date to be more readable
  const formattedDate = new Date(slot.date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  return (
    <Card
      sx={{
        mb: 2,
        cursor: 'pointer',
        transition: 'transform 0.2s ease-in-out',
        '&:hover': {
          transform: 'scale(1.02)',
          boxShadow: 3
        }
      }}
      onClick={() => onSelect(slot.id)}
    >
      <CardContent>
        <Typography variant="h6" component="h2">
          {slot.officeName}
        </Typography>
        <Typography color="text.secondary" gutterBottom>
          {formattedDate} at {slot.time}
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center" mt={1}>
          <Typography variant="body2">
            Capacity: {slot.capacity}
          </Typography>
          <Chip
            label={`${availableSpots} available`}
            color={availabilityColor}
            size="small"
          />
        </Stack>
      </CardContent>
    </Card>
  );
};

export default AppointmentCard;
