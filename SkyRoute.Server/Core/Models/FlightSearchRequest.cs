using System.ComponentModel.DataAnnotations;

namespace SkyRoute.Server.Core.Models
{
    public record FlightSearchRequest(
        [Required]
        [StringLength(3, MinimumLength = 3)]
        string Origin,
        [Required]
        [StringLength(3, MinimumLength = 3)]
        string Destination,
        [Required]
        DateTime TravelDate,
        [Range(1,9)]
        int Passengers,
        [Required]
        [RegularExpression(@"^(Economy|Business|First)$", ErrorMessage = "CabinClass must be either Economy, Business, or First.")]
        string CabinClass
    );
}