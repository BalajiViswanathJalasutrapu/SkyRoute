using SkyRoute.Server.Core.Constants;
using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Infrastructure.Providers
{
    public class GlobalAirProvider : IFlightProvider
    {
        string IFlightProvider.ProviderName => GlobalAirConstants.ProviderName;

        public Task<IEnumerable<FlightResult>> SearchAsync(FlightSearchRequest request)
        {
            bool isDomestic = AirportConstants.IsDomestic(request.Origin, request.Destination);
            decimal cabinMultiplier = GlobalAirConstants.CabinMultipliers.GetValueOrDefault(request.CabinClass, 1.0m);

            var results = GlobalAirConstants.FlightTemplates.Select(t =>
            {
                var departure = new DateTimeOffset(
                    request.TravelDate.Year, request.TravelDate.Month, request.TravelDate.Day,
                    t.DepartureHour, 0, 0, TimeSpan.Zero);

                decimal pricePerPerson = Math.Round(t.BaseFare * cabinMultiplier * GlobalAirConstants.SurchargeRate, 2);
                decimal totalPrice     = Math.Round(pricePerPerson * request.Passengers, 2);

                return new FlightResult(
                    FlightId:        Guid.NewGuid().ToString(),
                    ProviderName:    GlobalAirConstants.ProviderName,
                    FlightNumber:    t.FlightNumber,
                    Origin:          request.Origin,
                    Destination:     request.Destination,
                    DepartureTime:    departure,
                    ArrivalTime:     departure.AddMinutes(t.DurationMinutes),
                    DurationMinutes: t.DurationMinutes,
                    CabinClass:      request.CabinClass,
                    PricePerPerson:  pricePerPerson,
                    TotalPrice:      totalPrice,
                    IsDomestic:      isDomestic
                );
            });

            return Task.FromResult(results);
        }
    }
}
