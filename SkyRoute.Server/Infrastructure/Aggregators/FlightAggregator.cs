using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Infrastructure.Aggregators
{
    public class FlightAggregator : IFlightAggregator
    {
        private readonly IEnumerable<IFlightProvider> _providers;
        private readonly ILogger<FlightAggregator> _logger;

        public FlightAggregator(IEnumerable<IFlightProvider> providers, ILogger<FlightAggregator> logger)
        {
            _providers = providers;
            _logger = logger;
        }

        public async Task<IEnumerable<FlightResult>> AggregateSearchResultsAsync(FlightSearchRequest request)
        {
            var tasks = _providers.Select(async provider =>
            {
                try
                {
                    return await provider.SearchAsync(request);
                }
                catch (Exception ex)
                {
                    _logger.LogError(ex, "Provider {ProviderName} failed for {Origin}->{Destination}",
                        provider.ProviderName, request.Origin, request.Destination);
                    return Enumerable.Empty<FlightResult>();
                }
            });

            var results = await Task.WhenAll(tasks);
            return results.SelectMany(r => r);
        }
    }
}
