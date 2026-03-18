import React, { useState } from 'react';
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  Select,
  Stack,
  Heading,
  Flex,
  useToast
} from '@chakra-ui/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface SlotSearchProps {
  onSearch: (params: {
    location?: string;
    date?: Date;
    available?: number;
  }) => void;
  isLoading: boolean;
}

const SlotSearch: React.FC<SlotSearchProps> = ({ onSearch, isLoading }) => {
  const toast = useToast();
  const [location, setLocation] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [minAvailable, setMinAvailable] = useState<string>('');

  // Mock data for locations (in a real app, this would come from an API)
  const locations = [
    { id: '1', name: 'London' },
    { id: '2', name: 'Manchester' },
    { id: '3', name: 'Birmingham' },
    { id: '4', name: 'Glasgow' },
    { id: '5', name: 'Liverpool' }
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const params: {
        location?: string;
        date?: Date;
        available?: number;
      } = {};

      if (location) params.location = location;
      if (selectedDate) params.date = selectedDate;
      if (minAvailable) params.available = parseInt(minAvailable, 10);

      onSearch(params);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'An error occurred while searching for slots',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    }
  };

  const handleClear = () => {
    setLocation('');
    setSelectedDate(null);
    setMinAvailable('');
    onSearch({});
  };

  return (
    <Box
      p={5}
      shadow="md"
      borderWidth="1px"
      borderRadius="md"
      bg="white"
      mb={6}
    >
      <Heading size="md" mb={4}>Find Available Appointments</Heading>

      <form onSubmit={handleSearch}>
        <Stack spacing={4}>
          <FormControl>
            <FormLabel>Office Location</FormLabel>
            <Select
              placeholder="Select location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
            >
              {locations.map(loc => (
                <option key={loc.id} value={loc.name}>{loc.name}</option>
              ))}
            </Select>
          </FormControl>

          <FormControl>
            <FormLabel>Date</FormLabel>
            <DatePicker
              selected={selectedDate}
              onChange={(date: Date) => setSelectedDate(date)}
              dateFormat="yyyy-MM-dd"
              minDate={new Date()}
              customInput={<Input />}
              placeholderText="Select a date"
            />
          </FormControl>

          <FormControl>
            <FormLabel>Minimum Available Spots</FormLabel>
            <Input
              type="number"
              value={minAvailable}
              onChange={(e) => setMinAvailable(e.target.value)}
              placeholder="Enter minimum available spots"
              min={1}
            />
          </FormControl>

          <Flex justify="space-between">
            <Button
              colorScheme="blue"
              type="submit"
              isLoading={isLoading}
              loadingText="Searching..."
            >
              Search
            </Button>

            <Button
              variant="outline"
              onClick={handleClear}
              isDisabled={isLoading}
            >
              Clear Filters
            </Button>
          </Flex>
        </Stack>
      </form>
    </Box>
  );
};

export default SlotSearch;
