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
Running `dotnet run` in `SkyRoute.Server/` automatically spawns `npm run dev` via the ASP.NET SPA proxy middleware — you don't need to start the frontend separately in development.

## Architecture

SkyRoute is a flight search aggregator SPA. The .NET 8 backend fans out to multiple mocked flight providers concurrently, aggregates results, and serves them via REST API. The React 18 frontend handles search, sorting, and display.

### Backend (`SkyRoute.Server/`)

**Layer structure:**
- `Controllers/` — API controllers (REST endpoints)
- `Core/Interfaces/` — `IFlightProvider` contract that all airline providers implement
- `Core/Models/` — `FlightSearchRequest`, `FlightResult` domain models
- `Infrastructure/Providers/` — `GlobalAirProvider` and `BudgetWingsProvider` (Strategy Pattern)
- `Infrastructure/Aggregators/` — `FlightAggregator` uses `Task.WhenAll` to hit all providers concurrently (Scatter-Gather)

**Key design decisions:**
- Provider pricing logic: `GlobalAir` = base fare + 15% surcharge; `BudgetWings` = base fare − 10% (min $29.99)
- `IMemoryCache` mocks Redis; a concurrent dictionary mocks the database — swappable via DI
- `IExceptionHandler` provides standardized global error responses
- New providers only require implementing `IFlightProvider` and registering in DI — no core changes needed

### Frontend (`skyroute.client/src/`)

- React 18 with plain JSX (no TypeScript)
- CSS Modules in `src/styles/` for component-scoped styles (`.module.css` files)
- Shared/reusable components live in `src/core/components/`; feature-specific components are co-located under `src/features/<feature-name>/components/` with their hooks in `src/features/<feature-name>/hooks/`
- Current features: `flight-search` (search form + results) and `flight-booking` (booking form + passenger validation)
- Sorting (by price, duration, departure time) runs client-side to minimize API calls
- Dynamic form validation switches between "Passport Number" (international routes) and "National ID" (domestic) based on selected origin/destination

### Frontend–Backend Communication

Vite proxies API calls to the .NET backend. The proxy in `vite.config.js` must route `/api/flights` (update from the default `/weatherforecast` scaffold). In production, .NET serves the Vite build as static files with SPA fallback to `/index.html`.

## Domain

6 hardcoded airports. Search parameters: origin, destination, date, passengers (1–9), cabin class. Results show total price and price per person.

### End-to-End
- Implement SOLID principles guide both backend architecture (e.g. Strategy Pattern for providers, Dependency Injection for testability) and frontend structure (e.g. custom hooks for side effects, component co-location for maintainability)
- Always Implement Secure coding practices (e.g. input validation, error handling) and follow the principle of least privilege when designing API endpoints and data access layers
- Always follow standard best practices for REST API design (e.g. proper HTTP methods, status codes, and resource naming conventions) and React component design (e.g. separation of concerns, reusable components, and state management)