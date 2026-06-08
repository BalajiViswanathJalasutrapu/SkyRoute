namespace SkyRoute.Server.Infrastructure.Providers
{
    internal static class GlobalAirConstants
    {
        internal const string ProviderName  = "GlobalAir";
        internal const decimal SurchargeRate = 1.15m;

        internal static readonly (string FlightNumber, int DepartureHour, int DurationMinutes, decimal BaseFare)[] FlightTemplates =
        [
            ("GA101", 6,  180, 150m),
            ("GA205", 12, 210, 200m),
            ("GA318", 18, 195, 175m),
        ];

        internal static readonly Dictionary<string, decimal> CabinMultipliers = new()
        {
            ["Economy"]  = 1.0m,
            ["Business"] = 2.5m,
            ["First"]    = 4.0m,
        };
    }
}
