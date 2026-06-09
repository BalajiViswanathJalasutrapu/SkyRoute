using Microsoft.Extensions.Caching.Memory;
using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Infrastructure.Services;

public class FlightSearchService(IFlightAggregator aggregator, IMemoryCache cache, ILogger<FlightSearchService> logger) : IFlightSearchService
{
    private static readonly TimeSpan SearchCacheTtl = TimeSpan.FromMinutes(30);

    public async Task<IEnumerable<FlightResult>> SearchAsync(FlightSearchRequest request)
    {
        logger.LogInformation("Flight search: {Origin} -> {Destination} on {Date}, {Passengers} passenger(s), {CabinClass}",
            request.Origin, request.Destination, request.TravelDate.ToString("yyyy-MM-dd"),
            request.Passengers, request.CabinClass);

        var results = (await aggregator.AggregateSearchResultsAsync(request)).ToList();

        foreach (var flight in results)
            cache.Set($"flight:{flight.FlightId}", flight, SearchCacheTtl);

        logger.LogInformation("Search returned {Count} result(s) for {Origin} -> {Destination}",
            results.Count, request.Origin, request.Destination);

        return results;
    }
}
