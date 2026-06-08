using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Controllers
{
    [ApiController]
    [Route("api/flights")]
    public class FlightsController : ControllerBase
    {
        private readonly IFlightAggregator _aggregator;
        private readonly IBookingRepository _bookingRepository;
        private readonly IMemoryCache _cache;
        private readonly ILogger<FlightsController> _logger;

        private static readonly TimeSpan SearchCacheTtl = TimeSpan.FromMinutes(30);

        public FlightsController(IFlightAggregator aggregator, IBookingRepository bookingRepository, IMemoryCache cache, ILogger<FlightsController> logger)
        {
            _aggregator = aggregator;
            _bookingRepository = bookingRepository;
            _cache = cache;
            _logger = logger;
        }

        [HttpPost("search")]
        public async Task<IActionResult> Search([FromBody] FlightSearchRequest request)
        {
            _logger.LogInformation("Flight search: {Origin} -> {Destination} on {Date}, {Passengers} passenger(s), {CabinClass}",
                request.Origin, request.Destination, request.TravelDate.ToString("yyyy-MM-dd"),
                request.Passengers, request.CabinClass);

            var results = (await _aggregator.AggregateSearchResultsAsync(request)).ToList();

            foreach (var flight in results)
                _cache.Set($"flight:{flight.FlightId}", flight, SearchCacheTtl);

            _logger.LogInformation("Search returned {Count} result(s) for {Origin} -> {Destination}",
                results.Count, request.Origin, request.Destination);

            return Ok(results);
        }

        [HttpPost("book")]
        public async Task<IActionResult> Book([FromBody] BookingRequest request)
        {
            _logger.LogInformation("Booking attempt for flight {FlightId}, {Passengers} passenger(s)",
                request.FlightId, request.PassengerCount);

            if (!_cache.TryGetValue<FlightResult>($"flight:{request.FlightId}", out var flight) || flight is null)
            {
                _logger.LogWarning("Booking failed: flight {FlightId} not found in cache", request.FlightId);
                return NotFound(new { message = $"Flight '{request.FlightId}' not found. Search results may have expired." });
            }

            decimal totalFare = Math.Round(flight.PricePerPerson * request.PassengerCount, 2);
            var booking = await _bookingRepository.CreateBookingAsync(request, totalFare);

            _logger.LogInformation("Booking created: {BookingReference} for flight {FlightId}, total {TotalFare:C}",
                booking.BookingReference, request.FlightId, totalFare);

            return Ok(booking);
        }

        [HttpGet("bookings/{bookingReference}")]
        public async Task<IActionResult> GetBooking(string bookingReference)
        {
            var booking = await _bookingRepository.GetBookingByIdAsync(bookingReference);

            if (booking is null)
            {
                _logger.LogWarning("Booking lookup failed: {BookingReference} not found", bookingReference);
                return NotFound(new { message = $"Booking '{bookingReference}' not found." });
            }

            return Ok(booking);
        }
    }
}
