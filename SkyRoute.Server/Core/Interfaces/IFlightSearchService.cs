using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Core.Interfaces;

public interface IFlightSearchService
{
    Task<IEnumerable<FlightResult>> SearchAsync(FlightSearchRequest request);
}
