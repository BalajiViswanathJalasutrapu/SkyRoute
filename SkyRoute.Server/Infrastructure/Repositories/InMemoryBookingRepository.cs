using Microsoft.Extensions.Caching.Memory;
using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;
using System.Collections.Concurrent;

namespace SkyRoute.Server.Infrastructure.Repositories
{
    public class InMemoryBookingRepository : IBookingRepository
    {
        private readonly IMemoryCache _cache;
        private readonly ILogger<InMemoryBookingRepository> _logger;
        private readonly ConcurrentDictionary<string, BookingRecord> _bookings = new();

        public InMemoryBookingRepository(IMemoryCache cache, ILogger<InMemoryBookingRepository> logger)
        {
            _cache = cache;
            _logger = logger;
        }

        public Task<BookingRecord> CreateBookingAsync(BookingRequest request, decimal totalFare)
        {
            _cache.TryGetValue<FlightResult>($"flight:{request.FlightId}", out var flight);

            var record = new BookingRecord(
                BookingReference:   GenerateBookingReference(),
                FlightId:           request.FlightId,
                ProviderName:       flight?.ProviderName  ?? string.Empty,
                Origin:             flight?.Origin        ?? string.Empty,
                Destination:        flight?.Destination   ?? string.Empty,
                DepartureTime:       flight?.DepartureTime ?? DateTimeOffset.MinValue,
                ArrivalTime:        flight?.ArrivalTime   ?? DateTimeOffset.MinValue,
                CabinClass:         request.CabinClass,
                IsDomestic:         flight?.IsDomestic    ?? false,
                PricePerPerson:     Math.Round(totalFare / request.PassengerCount, 2),
                PassengerCount:     request.PassengerCount,
                TotalPrice:         totalFare,
                LeadPassengerName:  request.LeadPassenger.FullName,
                LeadPassengerEmail: request.LeadPassenger.Email
            );

            _bookings[record.BookingReference] = record;

            _logger.LogInformation("Booking {BookingReference} stored: {Origin} -> {Destination}, {CabinClass}, {PassengerCount} passenger(s), total {TotalPrice:C}",
                record.BookingReference, record.Origin, record.Destination,
                record.CabinClass, record.PassengerCount, record.TotalPrice);

            return Task.FromResult(record);
        }

        public Task<BookingRecord?> GetBookingByIdAsync(string bookingId)
        {
            _bookings.TryGetValue(bookingId, out var record);
            return Task.FromResult(record);
        }

        private static string GenerateBookingReference() =>
            Guid.NewGuid().ToString("N").ToUpper()[..8];
    }
}
