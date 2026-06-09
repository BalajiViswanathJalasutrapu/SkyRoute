import { useState, useCallback } from 'react';

export function useFlightBooking() {
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const book = useCallback(async ({ flightId, cabinClass, leadPassenger, additionalPassengers }) => {
    setLoading(true);
    setError(null);
    setBooking(null);

    try {
      const response = await fetch('/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ flightId, cabinClass, leadPassenger, additionalPassengers }),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.title ?? `Booking failed (${response.status})`);
      }

      const data = await response.json();
      setBooking(data);
    } catch (err) {
      setError(err.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { booking, loading, error, book };
}
