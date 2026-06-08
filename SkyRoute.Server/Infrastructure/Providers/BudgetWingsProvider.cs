using SkyRoute.Server.Core.Constants;
using SkyRoute.Server.Core.Interfaces;
using SkyRoute.Server.Core.Models;

namespace SkyRoute.Server.Infrastructure.Providers
{
    public class BudgetWingsProvider : IFlightProvider
    {
        string IFlightProvider.ProviderName => BudgetWingsConstants.ProviderName;

        public Task<IEnumerable<FlightResult>> SearchAsync(FlightSearchRequest request)
        {
            bool isDomestic = AirportConstants.IsDomestic(request.Origin, request.Destination);
            decimal cabinMultiplier = BudgetWingsConstants.CabinMultipliers.GetValueOrDefault(request.CabinClass, 1.0m);

            var results = BudgetWingsConstants.FlightTemplates.Select(t =>
            {
                var departure = new DateTimeOffset(
                    request.TravelDate.Year, request.TravelDate.Month, request.TravelDate.Day,
                    t.DepartureHour, 0, 0, TimeSpan.Zero);

                decimal discountedFare = t.BaseFare * cabinMultiplier * BudgetWingsConstants.DiscountRate;
                decimal pricePerPerson = Math.Round(Math.Max(discountedFare, BudgetWingsConstants.MinimumFare), 2);
                decimal totalPrice     = Math.Round(pricePerPerson * request.Passengers, 2);

                return new FlightResult(
                    FlightId:        Guid.NewGuid().ToString(),
                    ProviderName:    BudgetWingsConstants.ProviderName,
                    FlightNumber:    t.FlightNumber,
                    Origin:          request.Origin,
                    Destination:     request.Destination,
                    DepartureTime:   departure,
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
