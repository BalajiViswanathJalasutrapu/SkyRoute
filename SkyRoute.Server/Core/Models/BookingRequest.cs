using System.ComponentModel.DataAnnotations;

namespace SkyRoute.Server.Core.Models;

public record BookingRequest
(
    [Required]
    string FlightId,
    [Required]
    string CabinClass,
    [Required]
    PassengerDetails LeadPassenger,
    [Required]
    [MaxLength(8)]
    IReadOnlyList<AdditionalPassengerDetails> AdditionalPassengers
)
{
    public int PassengerCount => 1 + AdditionalPassengers.Count;
}
