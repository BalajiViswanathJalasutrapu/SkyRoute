using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Core.Interfaces
{
    public interface IBookingRepository
    {
        Task<BookingRecord> CreateBookingAsync(BookingRequest request, decimal totalFare);
        Task<BookingRecord?> GetBookingByIdAsync(string bookingId);
    }
}
