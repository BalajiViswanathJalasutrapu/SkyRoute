using Microsoft.Extensions.Caching.Memory;
using SkyRoute.Server.Core.Exceptions;
using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Infrastructure.Services;

public class BookingService(IMemoryCache cache, IBookingRepository repository, ILogger<BookingService> logger) : IBookingService
{
    public async Task<BookingRecord> CreateBookingAsync(BookingRequest request)
    {
        if (!cache.TryGetValue<FlightResult>($"flight:{request.FlightId}", out var flight) || flight is null)
        {
            logger.LogWarning("Booking failed: flight {FlightId} not found in cache", request.FlightId);
            throw new NotFoundException($"Flight '{request.FlightId}' not found. Search results may have expired.");
        }

        decimal totalFare = Math.Round(flight.PricePerPerson * request.PassengerCount, 2);

        var record = new BookingRecord(
            BookingReference:   GenerateBookingReference(),
            FlightId:           request.FlightId,
            ProviderName:       flight.ProviderName,
            Origin:             flight.Origin,
            Destination:        flight.Destination,
            DepartureTime:      flight.DepartureTime,
            ArrivalTime:        flight.ArrivalTime,
            CabinClass:         request.CabinClass,
            IsDomestic:         flight.IsDomestic,
            PricePerPerson:     flight.PricePerPerson,
            PassengerCount:     request.PassengerCount,
            TotalPrice:         totalFare,
            LeadPassengerName:  request.LeadPassenger.FullName,
            LeadPassengerEmail: request.LeadPassenger.Email
        );

        await repository.SaveAsync(record);

        logger.LogInformation("Booking {BookingReference} created: {Origin} -> {Destination}, {CabinClass}, {PassengerCount} passenger(s), total {TotalPrice:C}",
            record.BookingReference, record.Origin, record.Destination,
            record.CabinClass, record.PassengerCount, record.TotalPrice);

        return record;
    }

    public async Task<BookingRecord> GetBookingByIdAsync(string bookingId)
    {
        var record = await repository.GetByReferenceAsync(bookingId);

        if (record is null)
        {
            logger.LogWarning("Booking lookup failed: {BookingReference} not found", bookingId);
            throw new NotFoundException($"Booking '{bookingId}' not found.");
        }

        return record;
    }

    private static string GenerateBookingReference() =>
        Guid.NewGuid().ToString("N").ToUpper()[..8];
}
