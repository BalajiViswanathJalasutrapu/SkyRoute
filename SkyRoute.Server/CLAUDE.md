# CLAUDE.md (Backend: SkyRoute.Server)

Specific architectural rules, coding standards, and common workflows for the .NET 8 Web API project.
Cross-cutting rules (domain values, pricing formulas, AI role boundaries) live in the root `CLAUDE.md`.

---

## Commands

```bash
dotnet build                          # Validate compilation
dotnet test                           # Run unit tests — must pass before any commit
dotnet run --launch-profile http      # http://localhost:5037 + Swagger at /swagger
dotnet run --launch-profile https     # https://localhost:7016
```

---

## Coding standards

### C# 12 / .NET 8 syntax

- **File-scoped namespaces** — always use `namespace SkyRoute.Server.Core;` not block-scoped
- **Primary constructors** — always use primary constructors when injecting dependencies into classes and services
- **Pricing types** — use `decimal` for all pricing, currency, and fare arithmetic — never `float` or `double`
- **DTO immutability** — use positional record types for all API request objects and immutable DTOs

### Layer boundaries

- **Skinny controllers** — a controller's only job is to receive the request, call the service, and return the result. No null checks, no business logic, no caching — all of that belongs in the service layer. A controller action should be three lines: call service, return `Ok(result)`.
- **Services own error handling** — services throw domain exceptions (e.g. `NotFoundException`) instead of returning null. `GlobalExceptionHandler` maps these to the correct HTTP status codes. Controllers never inspect service return values for null.
- **Defensive concurrency** — when using `Task.WhenAll` across providers, wrap each provider call in its own `try/catch`; on failure log the error and return an empty collection so the remaining providers still return results
- **Structured logging** — never use string interpolation in log calls; use structured placeholders:

```csharp
_logger.LogInformation("Processing search from {Origin} to {Destination}", request.Origin, request.Destination);
```

### Error handling

- All system and domain exceptions bubble up to the global `IExceptionHandler` middleware
- Returns uniform RFC 9457 problem details to clients
- Full exception detail stays server-side — never exposed in the response body
- RFC 9457 extension fields (`detail`, custom members) must contain only safe, user-facing text — never stack traces, file paths, DB connection info, or internal identifiers

### Testing

- Every new file under `SkyRoute.Server/` must have a corresponding test file under `skyroute.Server.Tests/` in the same relative folder structure. For example, `Infrastructure/Services/BookingService.cs` → `Unit/Services/BookingServiceTests.cs`; `Controllers/BookingsController.cs` → `Unit/Controllers/BookingsControllerTests.cs`.
- Use hand-written test doubles (no mocking library). Declare them as private sealed nested classes inside the test class.
- Test naming convention: `MethodName_ExpectedBehaviour_WhenCondition`