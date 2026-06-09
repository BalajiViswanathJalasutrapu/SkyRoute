# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Backend (run from `SkyRoute.Server/`)
```bash
dotnet build
dotnet run --launch-profile http    # http://localhost:5037 + Swagger at /swagger
dotnet run --launch-profile https   # https://localhost:7016
```

### Frontend (run from `skyroute.client/`)
```bash
npm run dev      # https://localhost:51560
npm run build
npm run lint
npm run preview
```

### Full-stack
Running `dotnet run` in `SkyRoute.Server/` automatically spawns `npm run dev` via the ASP.NET SPA proxy middleware — no need to start the frontend separately in development.

### Testing

**Backend** — the test project lives at `../skyroute.Server.Tests/` (one level above the repo root, referenced by `SkyRoute.slnx`):
```bash
# Run from the skyroute.Server.Tests/ directory or the solution root
dotnet test
dotnet test --filter "FullyQualifiedName~BookingServiceTests"   # single class
dotnet test --filter "DisplayName~ThrowsNotFoundException"       # single test by name
dotnet test --collect:"XPlat Code Coverage"
```

**Frontend** — run from `skyroute.client/`:
```bash
npm test                  # run all tests once (Jest + jsdom)
npm run test:watch        # watch mode
npx jest src/__tests__/unit/hooks/useFlightSearch.test.js   # single file
```

## Architecture

SkyRoute is a flight search aggregator SPA. The .NET 8 backend fans out to multiple mocked flight providers concurrently, aggregates results, and serves them via REST API. The React 18 frontend handles search, sorting, and display.

### Backend (`SkyRoute.Server/`)

**Layer structure:**
- `Controllers/` — skinny controllers, 3-line actions; `POST /api/flights/search`, `POST /api/bookings`, `GET /api/bookings/{bookingReference}`
- `Core/Interfaces/` — `IFlightProvider`, `IFlightAggregator`, `IFlightSearchService`, `IBookingService`, `IBookingRepository`
- `Core/Models/` — positional records with DataAnnotations: `FlightSearchRequest`, `FlightResult`, `BookingRequest`, `BookingRecord`, `PassengerDetails`
- `Infrastructure/Providers/` — `GlobalAirProvider` and `BudgetWingsProvider` (Strategy Pattern)
- `Infrastructure/Aggregators/` — `FlightAggregator` uses `Task.WhenAll` across all `IFlightProvider` registrations; each provider wrapped in `try/catch` so one failure doesn't abort the others (Scatter-Gather with fault isolation)
- `Infrastructure/Services/` — `FlightSearchService` caches each result by `"flight:{flightId}"` with 30-min TTL; `BookingService` looks up the cached flight then persists a `BookingRecord` with an 8-char uppercase alphanumeric booking reference
- `Infrastructure/Handlers/GlobalExceptionHandler.cs` — maps `NotFoundException` → 404, everything else → 500; returns RFC 9457 `ProblemDetails` (never exposes stack traces)

**Key design decisions:**
- Provider pricing: `GlobalAir` = base fare × cabin multiplier × 1.15; `BudgetWings` = base fare × cabin multiplier × 0.90, floor at $29.99. Cabin multipliers (both providers): Economy 1×, Business 2.5×, First 4×.
- `IMemoryCache` mocks Redis; `ConcurrentDictionary` (`InMemoryBookingRepository`) mocks a database — both swappable via DI
- New providers only require implementing `IFlightProvider` and registering in DI — no core changes needed
- `IBookingRepository` is Singleton; services are Scoped; both providers are registered as `IFlightProvider` (multiple registrations consumed via `IEnumerable<IFlightProvider>`)

**Testing conventions (in `skyroute.Server.Tests/`):**
- Test method naming: `MethodName_ExpectedBehaviour_WhenCondition`
- No mocking library — all test doubles are hand-written stubs/fakes in `Stubs/` and `Fakes/`
- `TestDataBuilder` provides factory methods with sensible defaults for all model types
- Integration tests use `SkyRouteWebApplicationFactory` (replaces real providers with `StubProvider`)

### Frontend (`skyroute.client/src/`)

- React 18 with plain JSX (no TypeScript, no routing library)
- `App.jsx` is a two-state view machine: `'search'` ↔ `'booking'` via a single `useState`. No React Router.
- Feature components and their hooks are co-located under `src/features/<feature>/components/` and `src/features/<feature>/hooks/`; shared components are in `src/core/components/`
- CSS Modules in `src/styles/` — import via `@styles/` alias (e.g. `import styles from '@styles/flight-search.module.css'`)
- Vite path aliases: `@` → `src/`, `@styles` → `src/styles/`, `@core` → `src/core/`
- Sorting (by price, duration, departure time) runs client-side via `useMemo` in `FlightSearch.jsx`
- Document validation in `BookingForm.jsx` switches dynamically: domestic = National ID (`/^[A-Z0-9]{8,12}$/`), international = Passport Number (`/^[A-Z0-9]{6,9}$/`), driven by `AirportConstants.IsDomestic()`
- Error responses are parsed as RFC 9457 `problem.title`; hooks fall back to HTTP status text

### Frontend–Backend Communication

Vite proxies all `/api` requests to the .NET backend (`https://localhost:7016` by default, configurable via `ASPNETCORE_HTTPS_PORT`). In production, .NET serves the Vite build as static files with SPA fallback to `/index.html`.

## Domain

6 hardcoded airports: LAX, JFK, ORD (US); DEL, BOM (IN); DXB (AE). Domestic = same country code. Search parameters: origin, destination, date, passengers (1–9), cabin class (Economy/Business/First). Results show total price and price per person.

## Sub-CLAUDE.md Files

Detailed layer-specific conventions live in:
- `SkyRoute.Server/CLAUDE.md` — C# 12 coding standards, layer boundaries, structured logging rules
- `skyroute.client/CLAUDE.md` — JSX-only rules, prop-types requirement, hook patterns, style alias usage
