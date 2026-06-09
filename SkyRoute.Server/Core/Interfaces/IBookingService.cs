using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Core.Interfaces;

public interface IBookingService
{
    Task<BookingRecord> CreateBookingAsync(BookingRequest request);
    Task<BookingRecord> GetBookingByIdAsync(string bookingId);
}