import React from 'react';
import {
  Box,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Button,
  Text,
  Flex,
  Spinner,
  Badge,
  Alert,
  AlertIcon,
  AlertTitle,
  AlertDescription,
} from '@chakra-ui/react';
import { format } from 'date-fns';
import { ISlot } from '../../services/api';

interface SlotListProps {
  slots: ISlot[];
  isLoading: boolean;
  error: string | null;
  onBookSlot: (slot: ISlot) => void;
  pagination: {
    total: number;
    limit: number;
    offset: number;
  };
  onPageChange: (offset: number) => void;
}

const SlotList: React.FC<SlotListProps> = ({
  slots,
  isLoading,
  error,
  onBookSlot,
  pagination,
  onPageChange
}) => {
  if (isLoading) {
    return (
      <Flex justify="center" align="center" height="200px">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  if (error) {
    return (
      <Alert status="error" borderRadius="md">
        <AlertIcon />
        <AlertTitle mr={2}>Error loading slots!</AlertTitle>
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  if (slots.length === 0) {
    return (
      <Alert status="info" borderRadius="md">
        <AlertIcon />
        <AlertTitle mr={2}>No slots found</AlertTitle>
        <AlertDescription>Try adjusting your search criteria.</AlertDescription>
      </Alert>
    );
  }

  const totalPages = Math.ceil(pagination.total / pagination.limit);
  const currentPage = Math.floor(pagination.offset / pagination.limit) + 1;

  const handlePrevPage = () => {
    const newOffset = Math.max(0, pagination.offset - pagination.limit);
    onPageChange(newOffset);
  };

  const handleNextPage = () => {
    const newOffset = pagination.offset + pagination.limit;
    if (newOffset < pagination.total) {
      onPageChange(newOffset);
    }
  };

  return (
    <Box shadow="md" borderWidth="1px" borderRadius="md" bg="white" overflowX="auto">
      <Table variant="simple">
        <Thead bg="gray.50">
          <Tr>
            <Th>Office</Th>
            <Th>Date</Th>
            <Th>Time</Th>
            <Th isNumeric>Available</Th>
            <Th>Action</Th>
          </Tr>
        </Thead>
        <Tbody>
          {slots.map((slot) => {
            const slotDate = new Date(slot.date);
            const availability = slot.available / slot.capacity;

            let availabilityColor = "green";
            if (availability < 0.3) availabilityColor = "red";
            else if (availability < 0.7) availabilityColor = "yellow";

            return (
              <Tr key={slot.id}>
                <Td>{slot.officeName}</Td>
                <Td>{format(slotDate, 'MMM dd, yyyy')}</Td>
                <Td>{slot.time}</Td>
                <Td isNumeric>
                  <Badge colorScheme={availabilityColor}>
                    {slot.available} / {slot.capacity}
                  </Badge>
                </Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="blue"
                    isDisabled={slot.available <= 0}
                    onClick={() => onBookSlot(slot)}
                  >
                    Book
                  </Button>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>

      {/* Pagination Controls */}
      <Flex justify="space-between" align="center" p={4}>
        <Text fontSize="sm">
          Showing {slots.length} of {pagination.total} results
        </Text>

        <Flex>
          <Button
            size="sm"
            onClick={handlePrevPage}
            isDisabled={pagination.offset === 0}
            mr={2}
          >
            Previous
          </Button>

          <Text fontSize="sm" px={2} alignSelf="center">
            Page {currentPage} of {totalPages}
          </Text>

          <Button
            size="sm"
            onClick={handleNextPage}
            isDisabled={(pagination.offset + pagination.limit) >= pagination.total}
            ml={2}
          >
            Next
          </Button>
        </Flex>
      </Flex>
    </Box>
  );
};

export default SlotList;
