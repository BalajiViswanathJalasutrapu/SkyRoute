namespace SkyRoute.Server.Infrastructure.Providers
{
    internal static class BudgetWingsConstants
    {
        internal const string  ProviderName  = "BudgetWings";
        internal const decimal DiscountRate  = 0.90m;
        internal const decimal MinimumFare   = 29.99m;

        internal static readonly (string FlightNumber, int DepartureHour, int DurationMinutes, decimal BaseFare)[] FlightTemplates =
        [
            ("BW412", 7,  200, 130m),
            ("BW527", 13, 225, 160m),
            ("BW631", 19, 185, 145m),
        ];

        internal static readonly Dictionary<string, decimal> CabinMultipliers = new()
        {
            ["Economy"]  = 1.0m,
            ["Business"] = 2.5m,
            ["First"]    = 4.0m,
        };
    }
}
