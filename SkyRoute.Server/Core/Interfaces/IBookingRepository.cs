using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Core.Interfaces
{
    public interface IBookingRepository
    {
        Task<BookingRecord> CreateBookingAsync(BookingRequest, decimal totalFare);
        Task<BookingRecord?> GetBookingByIdAsync(string bookingId);
    }
}
