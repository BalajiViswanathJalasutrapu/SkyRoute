# SkyRoute

SkyRoute is a flight search aggregator that fans out to multiple mocked airline providers concurrently and returns sorted, bookable results via a React single-page application.

- **Spec-driven:** `Spec.md` was written and committed before any implementation began.
- **Selective AI use:** Claude Code was used for implementation; all architectural decisions, trade-offs, and provider logic were human-guided and recorded in `prompts.md`.

---

## AI Tooling

| Item  | Value                                              |
|-------|----------------------------------------------------|
| Tool  | Claude Code (claude.ai/code)                       |
| Model | claude-sonnet-4-6                                  |
| Use   | Scaffolding, implementation, refactoring, and test generation guided by human-authored specs and prompts |

---

## Architecture Diagram

```
┌─────────────────────────────────────┐
│         React 18 Frontend           │
│  flight-search  │  flight-booking   │
└────────────┬────────────────────────┘
             │ HTTP (Vite proxy → /api)
             ▼
┌─────────────────────────────────────┐
│         .NET 8 REST API             │
│  FlightsController                  │
│  BookingsController                 │
└────────────┬────────────────────────┘
             │
             ▼
┌─────────────────────────────────────┐
│  FlightSearchService / BookingService│
│  IMemoryCache  │  IBookingRepository │
└────────────┬────────────────────────┘
             │ Task.WhenAll (scatter-gather)
             ▼
┌─────────────────────────────────────┐
│         FlightAggregator            │
│         IFlightAggregator           │
└────┬──────────────────────┬─────────┘
     │                      │
     ▼                      ▼
┌──────────────┐    ┌───────────────────┐
│ GlobalAir    │    │  BudgetWings      │
│ Provider     │    │  Provider         │
│ +15% fare    │    │  −10% (min $29.99)│
└──────────────┘    └───────────────────┘
```

- **Strategy Pattern:** Each airline implements `IFlightProvider`; new providers register in DI with no core changes.
- **Scatter-Gather:** `FlightAggregator` uses `Task.WhenAll` — per-provider `try/catch` ensures partial results survive a single provider failure.
- **Client-side sorting:** Price, duration, and departure-time sorting runs in the browser via `useMemo` to eliminate redundant API calls.

---

## Project Structure

```
SkyRoute/
├── SkyRoute.Server/
│   ├── Controllers/
│   ├── Core/
│   │   ├── Constants/
│   │   ├── Exceptions/
│   │   ├── Interfaces/
│   │   └── Models/
│   ├── Infrastructure/
│   │   ├── Aggregators/
│   │   ├── Handlers/
│   │   ├── Providers/
│   │   ├── Repositories/
│   │   └── Services/
│   └── Properties/
├── skyroute.client/
│   ├── public/
│   └── src/
│       ├── core/
│       │   └── components/
│       ├── features/
│       │   ├── flight-booking/
│       │   └── flight-search/
│       ├── styles/
│       └── __tests__/
│           ├── unit/
│           └── utils/
├── Spec.md
├── prompts.md
└── SkyRoute.slnx
```

---

## Tech Stack

| Layer     | Technology                              |
|-----------|-----------------------------------------|
| Frontend  | React 18, Vite, CSS Modules             |
| Backend   | .NET 8 Web API, C# 12                   |
| Caching   | `IMemoryCache` (Redis stand-in)         |
| Storage   | `ConcurrentDictionary` (DB stand-in)    |
| Testing   | xUnit (.NET), Jest + jsdom (React)      |

---

## Running Locally

### Backend

```bash
cd SkyRoute.Server
dotnet run --launch-profile http   # API at http://localhost:5037, Swagger at /swagger
```

### Frontend

```bash
cd skyroute.client
npm install
npm run dev                        # https://localhost:51560
```

> Running `dotnet run` in `SkyRoute.Server/` automatically starts the frontend via the ASP.NET SPA proxy — no need to start both manually.

---

## API Reference

| Method | Endpoint                         | Description                                      |
|--------|----------------------------------|--------------------------------------------------|
| POST   | `/api/flights/search`            | Search flights; caches each result for 30 min   |
| POST   | `/api/bookings`                  | Create a booking (flight must be in cache)       |
| GET    | `/api/bookings/{bookingReference}` | Retrieve a booking by reference               |

All error responses conform to **RFC 9457 Problem Details**. Full exception detail is never exposed in the response body.
