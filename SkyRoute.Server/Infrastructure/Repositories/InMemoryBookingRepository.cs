using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;
using System.Collections.Concurrent;

namespace SkyRoute.Server.Infrastructure.Repositories
{
    public class InMemoryBookingRepository(ILogger<InMemoryBookingRepository> logger) : IBookingRepository
    {
        private readonly ConcurrentDictionary<string, BookingRecord> _bookings = new();

        public Task SaveAsync(BookingRecord record)
        {
            _bookings[record.BookingReference] = record;
            logger.LogInformation("Booking {BookingReference} stored", record.BookingReference);
            return Task.CompletedTask;
        }

        public Task<BookingRecord?> GetByReferenceAsync(string bookingReference)
        {
            _bookings.TryGetValue(bookingReference, out var record);
            return Task.FromResult(record);
        }
    }
}
