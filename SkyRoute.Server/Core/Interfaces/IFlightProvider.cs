using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Core.Interfaces
{
    public interface IFlightProvider
    {
        string ProviderName { get; }

        Task<IEnumerable<FlightResult>> SearchAsync(FlightSearchRequest request);
    }
}
