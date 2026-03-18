import React, { useState, useEffect } from 'react';
import {
  Container,
  Box,
  Heading,
  useToast,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Text,
  useDisclosure
} from '@chakra-ui/react';
import SlotSearch from '../components/Dashboard/SlotSearch';
import SlotList from '../components/Dashboard/SlotList';
import { searchSlots, ISlot, IPaginatedResponse, createBooking } from '../services/api';
import { useAuth } from '../hooks/useAuth';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const [slots, setSlots] = useState<ISlot[]>([]);
  const [pagination, setPagination] = useState({
    total: 0,
    limit: 20,
    offset: 0
  });
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState({});
  const [selectedSlot, setSelectedSlot] = useState<ISlot | null>(null);
  const [isBooking, setIsBooking] = useState<boolean>(false);

  // Load slots when component mounts or search params change
  useEffect(() => {
    loadSlots(searchParams);
  }, [searchParams.location, searchParams.date, searchParams.available, pagination.offset]);

  const loadSlots = async (params: any) => {
    setIsLoading(true);
    setError(null);

    try {
      const response: IPaginatedResponse<ISlot> = await searchSlots({
        ...params,
        limit: pagination.limit,
        offset: pagination.offset
      });

      setSlots(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError('Failed to load appointment slots. Please try again later.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (params: any) => {
    // Reset pagination when doing a new search
    setPagination(prev => ({
      ...prev,
      offset: 0
    }));
    setSearchParams(params);
  };

  const handlePageChange = (offset: number) => {
    setPagination(prev => ({
      ...prev,
      offset
    }));
  };

  const handleBookSlot = (slot: ISlot) => {
    setSelectedSlot(slot);
    onOpen();
  };

  const confirmBooking = async () => {
    if (!selectedSlot) return;

    setIsBooking(true);

    try {
      await createBooking(selectedSlot.id);

      toast({
        title: 'Booking Confirmed',
        description: `Your appointment at ${selectedSlot.officeName} on ${selectedSlot.date} at ${selectedSlot.time} has been booked.`,
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh the slots list
      loadSlots(searchParams);

      onClose();
    } catch (err: any) {
      toast({
        title: 'Booking Failed',
        description: err.response?.data?.error || 'Unable to book the appointment. Please try again.',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsBooking(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <Box mb={8} display="flex" justifyContent="space-between" alignItems="center">
        <div>
          <Heading as="h1" size="xl" mb={2}>
            Passport Office Appointments
          </Heading>
          <Text color="gray.600">
            Search and book your passport appointment
          </Text>
        </div>
        <div className="text-gray-600">
          Welcome, <span className="font-semibold">{user?.email}</span>
        </div>
      </Box>

      <SlotSearch
        onSearch={handleSearch}
        isLoading={isLoading}
      />

      <SlotList
        slots={slots}
        isLoading={isLoading}
        error={error}
        onBookSlot={handleBookSlot}
        pagination={pagination}
        onPageChange={handlePageChange}
      />

      {/* Booking Confirmation Modal */}
      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Appointment Booking</ModalHeader>
          <ModalBody>
            {selectedSlot && (
              <>
                <Text mb={3}>Please confirm your appointment booking with the following details:</Text>
                <Box p={4} bg="gray.50" borderRadius="md">
                  <Text><strong>Office:</strong> {selectedSlot.officeName}</Text>
                  <Text><strong>Date:</strong> {selectedSlot.date}</Text>
                  <Text><strong>Time:</strong> {selectedSlot.time}</Text>
                </Box>
              </>
            )}
          </ModalBody>
          <ModalFooter>
            <Button
              variant="ghost"
              mr={3}
              onClick={onClose}
              isDisabled={isBooking}
            >
              Cancel
            </Button>
            <Button
              colorScheme="blue"
              onClick={confirmBooking}
              isLoading={isBooking}
              loadingText="Booking..."
            >
              Confirm Booking
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default Dashboard;
