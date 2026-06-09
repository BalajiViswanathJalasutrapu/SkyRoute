using Microsoft.AspNetCore.Mvc;
using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Controllers;

[ApiController]
[Route("api/flights")]
public class FlightsController(IFlightSearchService searchService) : ControllerBase
{
    [HttpPost("search")]
    public async Task<IActionResult> Search([FromBody] FlightSearchRequest request)
    {
        var results = await searchService.SearchAsync(request);
        return Ok(results);
    }
}
