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

        private static readonly TimeSpan SearchCacheTtl = TimeSpan.FromMinutes(30);

        public FlightsController(IFlightAggregator aggregator, IBookingRepository bookingRepository, IMemoryCache cache)
        {
            _aggregator = aggregator;
            _bookingRepository = bookingRepository;
            _cache = cache;
        }

        [HttpPost("search")]
        public async Task<IActionResult> Search([FromBody] FlightSearchRequest request)
        {
            var results = await _aggregator.AggregateSearchResultsAsync(request);

            foreach (var flight in results)
                _cache.Set($"flight:{flight.FlightId}", flight, SearchCacheTtl);

            return Ok(results);
        }

        [HttpPost("book")]
        public async Task<IActionResult> Book([FromBody] BookingRequest request)
        {
            if (!_cache.TryGetValue<FlightResult>($"flight:{request.FlightId}", out var flight) || flight is null)
                return NotFound(new { message = $"Flight '{request.FlightId}' not found. Search results may have expired." });

            decimal totalFare = Math.Round(flight.PricePerPerson * request.PassengerCount, 2);
            var booking = await _bookingRepository.CreateBookingAsync(request, totalFare);

            return Ok(booking);
        }

        [HttpGet("bookings/{bookingReference}")]
        public async Task<IActionResult> GetBooking(string bookingReference)
        {
            var booking = await _bookingRepository.GetBookingByIdAsync(bookingReference);

            if (booking is null)
                return NotFound(new { message = $"Booking '{bookingReference}' not found." });

            return Ok(booking);
        }
    }
}
