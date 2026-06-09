using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Core.Interfaces
{
    public interface IBookingRepository
    {
        Task SaveAsync(BookingRecord record);
        Task<BookingRecord?> GetByReferenceAsync(string bookingReference);
    }
}
