namespace SkyRoute.Server.Core.Constants
{
    public static class AirportConstants
    {
        private static readonly Dictionary<string, string> CountryByAirport = new()
        {
            ["LAX"] = "US",
            ["JFK"] = "US",
            ["ORD"] = "US",
            ["DEL"] = "IN",
            ["BOM"] = "IN",
            ["DXB"] = "AE",
        };

        public static readonly IReadOnlySet<string> All = CountryByAirport.Keys.ToHashSet();

        public static bool IsDomestic(string origin, string destination) =>
            CountryByAirport.TryGetValue(origin, out var originCountry) &&
            CountryByAirport.TryGetValue(destination, out var destinationCountry) &&
            originCountry == destinationCountry;
    }
}
