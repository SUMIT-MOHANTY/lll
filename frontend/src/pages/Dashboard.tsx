import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { getSlots } from '../services/slotService';
import { SlotsList } from '../components/SlotsList';
import { Slot, SlotFilters } from '../types';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SlotFilters>({
    limit: 20,
    offset: 0,
  });

  useEffect(() => {
    const fetchSlots = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await getSlots(filters);
        setSlots(response.data);
      } catch (err) {
        console.error('Failed to fetch slots:', err);
        setError('Failed to load appointment slots. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [filters]);

  const handleFilterChange = (newFilters: Partial<SlotFilters>) => {
    setFilters((prev) => ({
      ...prev,
      ...newFilters,
      // Reset pagination when filters change
      offset: newFilters.hasOwnProperty('offset') ? newFilters.offset! : 0,
    }));
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Available Appointment Slots</h1>
        <div className="text-gray-600">
          Welcome, <span className="font-semibold">{user?.email}</span>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <h2 className="text-lg font-semibold mb-4">Filter Slots</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Office location"
              onChange={(e) => handleFilterChange({ location: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
            <input
              type="date"
              className="w-full p-2 border rounded"
              onChange={(e) => handleFilterChange({ date: e.target.value || undefined })}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Min. Available Spots</label>
            <input
              type="number"
              min="1"
              className="w-full p-2 border rounded"
              placeholder="Minimum spots"
              onChange={(e) =>
                handleFilterChange({
                  available: e.target.value ? parseInt(e.target.value) : undefined
                })
              }
            />
          </div>
        </div>
        <div className="mt-4">
          <button
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            onClick={() => handleFilterChange({})}
          >
            Apply Filters
          </button>
          <button
            className="ml-2 bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            onClick={() => handleFilterChange({
              location: undefined,
              date: undefined,
              available: undefined,
              offset: 0
            })}
          >
            Reset Filters
          </button>
        </div>
      </div>

      <SlotsList slots={slots} loading={loading} error={error} />

      {!loading && !error && slots.length > 0 && (
        <div className="flex justify-between items-center mt-4">
          <button
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300 disabled:opacity-50"
            disabled={filters.offset === 0}
            onClick={() =>
              handleFilterChange({
                offset: Math.max(0, (filters.offset || 0) - (filters.limit || 20))
              })
            }
          >
            Previous Page
          </button>
          <span className="text-gray-600">
            Showing {filters.offset + 1} - {filters.offset + slots.length}
          </span>
          <button
            className="bg-gray-200 text-gray-800 px-4 py-2 rounded hover:bg-gray-300"
            onClick={() =>
              handleFilterChange({
                offset: (filters.offset || 0) + (filters.limit || 20)
              })
            }
          >
            Next Page
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
