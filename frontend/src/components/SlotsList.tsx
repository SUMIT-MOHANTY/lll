import React from 'react';
import { Slot } from '../types';

interface SlotsListProps {
  slots: Slot[];
  loading: boolean;
  error: string | null;
}

export const SlotsList: React.FC<SlotsListProps> = ({ slots, loading, error }) => {
  if (loading) {
    return (
      <div className="flex justify-center my-8">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded my-4">
        <p>{error}</p>
      </div>
    );
  }

  if (slots.length === 0) {
    return (
      <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded my-4">
        <p>No appointment slots available for the selected criteria.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 my-4">
      {slots.map((slot) => (
        <div
          key={slot.id}
          className="bg-white p-4 rounded-lg shadow hover:shadow-lg transition-shadow"
        >
          <div className="font-semibold text-lg text-blue-700">{slot.officeName}</div>
          <div className="mt-2">
            <div className="text-gray-700">
              <span className="font-medium">Date:</span> {new Date(slot.date).toLocaleDateString()}
            </div>
            <div className="text-gray-700">
              <span className="font-medium">Time:</span> {slot.time}
            </div>
            <div className="text-gray-700 mt-2">
              <span className="font-medium">Available:</span>{' '}
              <span className={`${slot.available > 3 ? 'text-green-600' : 'text-red-600'}`}>
                {slot.available} spots
              </span>
            </div>
          </div>
          <div className="mt-4">
            <button
              className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded transition-colors"
              onClick={() => console.log('Book slot:', slot.id)}
            >
              Book Appointment
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
