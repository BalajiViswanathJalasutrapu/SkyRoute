import { renderHook, act } from '@testing-library/react';
import { useFlightSearch } from '@/features/flight-search/hooks/useFlightSearch';
import { createOkResponse, createErrorResponse, createNetworkError } from '../../utils/fetchMock';

const defaultRequest = {
  origin: 'JFK',
  destination: 'LAX',
  travelDate: '2026-07-01',
  passengers: 1,
  cabinClass: 'Economy',
};

const flightResults = [
  { flightId: 'flt-1', origin: 'JFK', destination: 'LAX', totalPrice: 199.99 },
  { flightId: 'flt-2', origin: 'JFK', destination: 'LAX', totalPrice: 249.99 },
];

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('useFlightSearch — initial state', () => {
  it('starts with empty results, loading false, and no error', () => {
    const { result } = renderHook(() => useFlightSearch());

    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useFlightSearch — loading state', () => {
  it('sets loading to true while fetch is in flight', async () => {
    let resolveResponse;
    global.fetch = jest.fn(() => new Promise(res => { resolveResponse = res; }));

    const { result } = renderHook(() => useFlightSearch());

    act(() => { result.current.search(defaultRequest); });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolveResponse(createOkResponse([])); });

    expect(result.current.loading).toBe(false);
  });

  it('resets error and results when a new search starts', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(createErrorResponse(500, 'Server error'))
      .mockResolvedValueOnce(createOkResponse(flightResults));

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => { await result.current.search(defaultRequest); });
    expect(result.current.error).not.toBeNull();

    await act(async () => { await result.current.search(defaultRequest); });
    expect(result.current.error).toBeNull();
    expect(result.current.results).toEqual(flightResults);
  });
});

describe('useFlightSearch — successful response', () => {
  it('sets results and clears loading on success', async () => {
    global.fetch = jest.fn().mockResolvedValue(createOkResponse(flightResults));

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => { await result.current.search(defaultRequest); });

    expect(result.current.results).toEqual(flightResults);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets results to empty array when API returns empty list', async () => {
    global.fetch = jest.fn().mockResolvedValue(createOkResponse([]));

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => { await result.current.search(defaultRequest); });

    expect(result.current.results).toEqual([]);
  });
});

describe('useFlightSearch — request format', () => {
  it('POSTs to /api/flights/search with JSON content-type', async () => {
    global.fetch = jest.fn().mockResolvedValue(createOkResponse([]));

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => { await result.current.search(defaultRequest); });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/flights/search',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } })
    );
  });

  it('serialises all search parameters into the request body', async () => {
    global.fetch = jest.fn().mockResolvedValue(createOkResponse([]));

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => { await result.current.search(defaultRequest); });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body).toEqual(defaultRequest);
  });
});

describe('useFlightSearch — error handling', () => {
  it('sets error from problem details title on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue(createErrorResponse(400, 'Invalid search parameters'));

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => { await result.current.search(defaultRequest); });

    expect(result.current.error).toBe('Invalid search parameters');
    expect(result.current.results).toEqual([]);
    expect(result.current.loading).toBe(false);
  });

  it('falls back to status code message when response has no title', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.reject(new Error('not json')),
    });

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => { await result.current.search(defaultRequest); });

    expect(result.current.error).toBe('Search failed (503)');
  });

  it('sets error on network failure', async () => {
    global.fetch = jest.fn(() => createNetworkError('Failed to fetch'));

    const { result } = renderHook(() => useFlightSearch());

    await act(async () => { await result.current.search(defaultRequest); });

    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.loading).toBe(false);
  });
});
