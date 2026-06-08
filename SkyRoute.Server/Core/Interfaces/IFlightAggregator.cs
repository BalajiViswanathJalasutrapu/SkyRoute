using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Core.Interfaces
{
    public interface IFlightAggregator
    {
        Task<IEnumerable<FlightResult>> AggregateSearchResultsAsync(FlightSearchRequest request);
    }
}
