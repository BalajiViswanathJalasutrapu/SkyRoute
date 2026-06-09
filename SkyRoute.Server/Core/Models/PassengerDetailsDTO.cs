using System.ComponentModel.DataAnnotations;

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