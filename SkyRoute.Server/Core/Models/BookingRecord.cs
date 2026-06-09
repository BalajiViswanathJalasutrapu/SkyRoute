namespace SkyRoute.Server.Core.Models;

public record BookingRecord
(
    string BookingReference,
    string FlightId,
    string ProviderName,
    string Origin,
    string Destination,
    DateTimeOffset DepartureTime,
    DateTimeOffset ArrivalTime,
    string CabinClass,
    bool IsDomestic,
    decimal PricePerPerson,
    int PassengerCount,
    decimal TotalPrice,
    PassengerDetails LeadPassenger,
    IReadOnlyList<AdditionalPassengerDetails> AdditionalPassengers
);
