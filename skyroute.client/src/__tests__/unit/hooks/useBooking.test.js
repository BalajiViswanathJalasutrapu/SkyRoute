import { renderHook, act } from '@testing-library/react';
import { useFlightBooking } from '@/features/flight-booking/hooks/useFlightBooking';
import { createOkResponse, createErrorResponse, createNetworkError } from '../../utils/fetchMock';

const defaultRequest = {
  flightId: 'flt-1',
  cabinClass: 'Economy',
  leadPassenger: { fullName: 'Jane Doe', email: 'jane@example.com', documentNumber: 'AB123456' },
  additionalPassengers: [],
};

const bookingRecord = {
  bookingReference: 'BOOK0001',
  flightId: 'flt-1',
  passengerCount: 1,
  totalPrice: 199.99,
  leadPassenger: { fullName: 'Jane Doe', email: 'jane@example.com', documentNumber: 'AB123456' },
  additionalPassengers: [],
};

beforeEach(() => {
  global.fetch = jest.fn();
});

describe('useFlightBooking — initial state', () => {
  it('starts with null booking, loading false, and no error', () => {
    const { result } = renderHook(() => useFlightBooking());

    expect(result.current.booking).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });
});

describe('useFlightBooking — loading state', () => {
  it('sets loading to true while fetch is in flight', async () => {
    let resolveResponse;
    global.fetch = jest.fn(() => new Promise(res => { resolveResponse = res; }));

    const { result } = renderHook(() => useFlightBooking());

    act(() => { result.current.book(defaultRequest); });

    expect(result.current.loading).toBe(true);

    await act(async () => { resolveResponse(createOkResponse(bookingRecord)); });

    expect(result.current.loading).toBe(false);
  });

  it('resets error and booking when a new booking attempt starts', async () => {
    global.fetch = jest.fn()
      .mockResolvedValueOnce(createErrorResponse(404, 'Flight not found'))
      .mockResolvedValueOnce(createOkResponse(bookingRecord));

    const { result } = renderHook(() => useFlightBooking());

    await act(async () => { await result.current.book(defaultRequest); });
    expect(result.current.error).not.toBeNull();

    await act(async () => { await result.current.book(defaultRequest); });
    expect(result.current.error).toBeNull();
    expect(result.current.booking).toEqual(bookingRecord);
  });
});

describe('useFlightBooking — successful response', () => {
  it('sets booking and clears loading on success', async () => {
    global.fetch = jest.fn().mockResolvedValue(createOkResponse(bookingRecord));

    const { result } = renderHook(() => useFlightBooking());

    await act(async () => { await result.current.book(defaultRequest); });

    expect(result.current.booking).toEqual(bookingRecord);
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  it('sets booking to the exact object returned by the API', async () => {
    const customRecord = {
      bookingReference: 'CUSTOM01',
      flightId: 'flt-99',
      totalPrice: 750.00,
      leadPassenger: { fullName: 'John Custom', email: 'j@example.com', documentNumber: 'ZZ000001' },
      additionalPassengers: [],
    };
    global.fetch = jest.fn().mockResolvedValue(createOkResponse(customRecord));

    const { result } = renderHook(() => useFlightBooking());

    await act(async () => { await result.current.book(defaultRequest); });

    expect(result.current.booking).toEqual(customRecord);
  });
});

describe('useFlightBooking — request format', () => {
  it('POSTs to /api/bookings with JSON content-type', async () => {
    global.fetch = jest.fn().mockResolvedValue(createOkResponse(bookingRecord));

    const { result } = renderHook(() => useFlightBooking());

    await act(async () => { await result.current.book(defaultRequest); });

    expect(global.fetch).toHaveBeenCalledWith(
      '/api/bookings',
      expect.objectContaining({ method: 'POST', headers: { 'Content-Type': 'application/json' } })
    );
  });

  it('serialises leadPassenger and additionalPassengers into the request body', async () => {
    global.fetch = jest.fn().mockResolvedValue(createOkResponse(bookingRecord));

    const { result } = renderHook(() => useFlightBooking());

    await act(async () => { await result.current.book(defaultRequest); });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.flightId).toBe('flt-1');
    expect(body.cabinClass).toBe('Economy');
    expect(body.leadPassenger).toEqual(defaultRequest.leadPassenger);
    expect(body.additionalPassengers).toEqual([]);
    expect(body).not.toHaveProperty('passengerCount');
  });

  it('serialises additionalPassengers when multiple passengers provided', async () => {
    global.fetch = jest.fn().mockResolvedValue(createOkResponse(bookingRecord));

    const requestWithAdditional = {
      flightId: 'flt-2',
      cabinClass: 'Business',
      leadPassenger: { fullName: 'Alice Lead', email: 'alice@example.com', documentNumber: 'P00000001' },
      additionalPassengers: [
        { fullName: 'Bob Extra', documentNumber: 'NID00001' },
        { fullName: 'Carol Extra', documentNumber: 'NID00002' },
      ],
    };

    const { result } = renderHook(() => useFlightBooking());

    await act(async () => { await result.current.book(requestWithAdditional); });

    const body = JSON.parse(global.fetch.mock.calls[0][1].body);
    expect(body.additionalPassengers).toHaveLength(2);
    expect(body.additionalPassengers[0]).toEqual({ fullName: 'Bob Extra', documentNumber: 'NID00001' });
    expect(body.additionalPassengers[1]).toEqual({ fullName: 'Carol Extra', documentNumber: 'NID00002' });
  });
});

describe('useFlightBooking — error handling', () => {
  it('sets error from problem details title on non-ok response', async () => {
    global.fetch = jest.fn().mockResolvedValue(createErrorResponse(404, 'Flight not found'));

    const { result } = renderHook(() => useFlightBooking());

    await act(async () => { await result.current.book(defaultRequest); });

    expect(result.current.error).toBe('Flight not found');
    expect(result.current.booking).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  it('falls back to status code message when response has no title', async () => {
    global.fetch = jest.fn().mockResolvedValue({
      ok: false,
      status: 503,
      json: () => Promise.reject(new Error('not json')),
    });

    const { result } = renderHook(() => useFlightBooking());

    await act(async () => { await result.current.book(defaultRequest); });

    expect(result.current.error).toBe('Booking failed (503)');
  });

  it('sets error on network failure', async () => {
    global.fetch = jest.fn(() => createNetworkError('Failed to fetch'));

    const { result } = renderHook(() => useFlightBooking());

    await act(async () => { await result.current.book(defaultRequest); });

    expect(result.current.error).toBe('Failed to fetch');
    expect(result.current.loading).toBe(false);
  });
});
