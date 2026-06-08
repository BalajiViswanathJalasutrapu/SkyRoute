using System.ComponentModel.DataAnnotations;

namespace SkyRoute.Server.Core.Models
{
    public record FlightResult(
        [Required]
        string FlightId,
        [Required]
        string ProviderName,
        [Required]
        string FlightNumber,
        [Required]
        [StringLength(3, MinimumLength = 3)]
        string Origin,
        [Required]
        [StringLength(3, MinimumLength = 3)]
        string Destination,
        DateTimeOffset DepartureTime,
        DateTimeOffset ArrivalTime,
        int DurationMinutes,
        [Required]
        [RegularExpression(@"^(Economy|Business|First)$", ErrorMessage = "CabinClass must be either Economy, Business, or First.")]
        string CabinClass,
        decimal PricePerPerson,
        decimal TotalPrice,
        bool IsDomestic
    );
}