using System.ComponentModel.DataAnnotations;

namespace SkyRoute.Server.Core.Models
{
    public record BookingRequest
    (
        [Required]
        string FlightId,
        [Required]
        string CabinClass,
        [Range(1,9)]
        int PassengerCount,
        [Required]
        PassengerDetails LeadPassenger
    );
}
