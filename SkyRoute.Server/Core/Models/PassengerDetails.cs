using System.ComponentModel.DataAnnotations;

namespace SkyRoute.Server.Core.Models
{
    public record PassengerDetails
    (
        [Required]
        [MaxLength(100)]
        string FullName,
        [Required]
        [EmailAddress]
        string Email,
        [Required]
        string DocumentNumber
    );
}