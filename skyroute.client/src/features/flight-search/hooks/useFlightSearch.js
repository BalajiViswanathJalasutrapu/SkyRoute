import { useState, useCallback } from 'react';

export function useFlightSearch() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState(null);

  const search = useCallback(async ({ origin, destination, travelDate, passengers, cabinClass }) => {
    setLoading(true);
    setError(null);
    setResults([]);

    try {
      const response = await fetch('/api/flights/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ origin, destination, travelDate, passengers, cabinClass }),
      });

      if (!response.ok) {
        const problem = await response.json().catch(() => null);
        throw new Error(problem?.title ?? `Search failed (${response.status})`);
      }

      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message ?? 'An unexpected error occurred.');
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}
