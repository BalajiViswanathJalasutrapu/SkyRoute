using System.ComponentModel.DataAnnotations;

namespace SkyRoute.Server.Core.Models;

public record AdditionalPassengerDetails
(
    [Required]
    [MaxLength(100)]
    string FullName,
    [Required]
    string DocumentNumber
);
