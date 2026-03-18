import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  Paper
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';

interface Location {
  id: string;
  name: string;
}

interface AppointmentSearchProps {
  locations: Location[];
  onSearch: (filters: SearchFilters) => void;
  loading: boolean;
}

export interface SearchFilters {
  location: string;
  date: Date | null;
  minAvailable: number;
}

const AppointmentSearch: React.FC<AppointmentSearchProps> = ({
  locations,
  onSearch,
  loading
}) => {
  const [filters, setFilters] = useState<SearchFilters>({
    location: '',
    date: null,
    minAvailable: 1,
  });

  const handleSearchClick = () => {
    onSearch(filters);
  };

  const handleReset = () => {
    setFilters({
      location: '',
      date: null,
      minAvailable: 1,
    });
    // Call search with reset filters
    onSearch({
      location: '',
      date: null,
      minAvailable: 1,
    });
  };

  return (
    <Paper elevation={2} sx={{ p: 3, mb: 4 }}>
      <Typography variant="h6" component="h2" gutterBottom>
        Search Available Appointments
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="location-select-label">Office Location</InputLabel>
            <Select
              labelId="location-select-label"
              id="location-select"
              value={filters.location}
              label="Office Location"
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
            >
              <MenuItem value="">All Locations</MenuItem>
              {locations.map((location) => (
                <MenuItem key={location.id} value={location.id}>
                  {location.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Grid>

        <Grid item xs={12} md={4}>
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <DatePicker
              label="Appointment Date"
              value={filters.date}
              onChange={(newValue) => setFilters({ ...filters, date: newValue })}
              slotProps={{
                textField: {
                  fullWidth: true,
                  variant: 'outlined'
                }
              }}
              disablePast
            />
          </LocalizationProvider>
        </Grid>

        <Grid item xs={12} md={4}>
          <FormControl fullWidth>
            <InputLabel id="min-available-label">Minimum Available Spots</InputLabel>
            <Select
              labelId="min-available-label"
              id="min-available-select"
              value={filters.minAvailable}
              label="Minimum Available Spots"
              onChange={(e) => setFilters({ ...filters, minAvailable: Number(e.target.value) })}
            >
              <MenuItem value={1}>At least 1</MenuItem>
              <MenuItem value={2}>At least 2</MenuItem>
              <MenuItem value={5}>At least 5</MenuItem>
              <MenuItem value={10}>At least 10</MenuItem>
            </Select>
          </FormControl>
        </Grid>
      </Grid>

      <Box display="flex" justifyContent="flex-end" mt={3} gap={2}>
        <Button
          variant="outlined"
          onClick={handleReset}
        >
          Reset
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSearchClick}
          disabled={loading}
        >
          Search Appointments
        </Button>
      </Box>
    </Paper>
  );
};

export default AppointmentSearch;
