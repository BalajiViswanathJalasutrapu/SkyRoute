using Microsoft.AspNetCore.Mvc;
using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Controllers;

[ApiController]
[Route("api/bookings")]
public class BookingsController(IBookingService bookingService) : ControllerBase
{
    [HttpPost]
    public async Task<IActionResult> Book([FromBody] BookingRequest request)
    {
        var booking = await bookingService.CreateBookingAsync(request);
        return Ok(booking);
    }

    [HttpGet("{bookingReference}")]
    public async Task<IActionResult> GetBooking(string bookingReference)
    {
        var booking = await bookingService.GetBookingByIdAsync(bookingReference);
        return Ok(booking);
    }
}
