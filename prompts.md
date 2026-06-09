# SkyRoute — Session Prompt Log

All entries follow the format: **Prompt → AI Output → Decision → Reason**

---

## 01 — Project Initialisation

**Prompt:** `claude init` — analyse codebase and create CLAUDE.md

**AI Output:** Generated `CLAUDE.md` (root) and `SkyRoute.Server/CLAUDE.md` covering build commands, layer structure, key design decisions, frontend architecture, and end-to-end SOLID guidelines.

**Decision:** Two CLAUDE.md files — one root-level (cross-cutting) and one backend-specific.

**Reason:** Backend coding standards (C# syntax rules, RFC 9457 error format) are too granular for the root file and would obscure frontend guidance if merged.

---

## 02 — GlobalAirProvider

**Prompt:** Create `GlobalAirProvider` implementing `IFlightProvider`; pricing from Spec.md; do not modify existing files.

**AI Output:** Created `Infrastructure/Providers/GlobalAirProvider.cs` — iterated over hardcoded flight templates, applied `baseFare × cabinMultiplier × 1.15` surcharge, returned `IEnumerable<FlightResult>` via `Task.FromResult`.

**Decision:** Pricing formula inline; `IsDomestic` derived from a local US-airports set at the time.

**Reason:** `IFlightProvider.SearchAsync` is synchronous in nature (no I/O), so `Task.FromResult` avoids unnecessary async state machine overhead while satisfying the async contract.

---

## 03 — Extract GlobalAirConstants

**Prompt:** Separate magic strings from `GlobalAirProvider` into a helper class.

**AI Output:** Created `Infrastructure/Providers/GlobalAirConstants.cs` with `ProviderName`, `SurchargeRate`, `CabinMultipliers`, and `FlightTemplates`; `GlobalAirProvider` now references only constants.

**Decision:** Constants class as a `static` peer class inside the same provider namespace.

**Reason:** Collocating constants with the provider that owns them prevents cross-namespace coupling while still removing magic literals from business logic.

---

## 04 — BudgetWingsProvider

**Prompt:** Create `BudgetWingsProvider` implementing `IFlightProvider`; use GlobalAirProvider as reference; do not modify existing files.

**AI Output:** Created `BudgetWingsConstants.cs` and `BudgetWingsProvider.cs`; pricing = `Math.Max(baseFare × cabinMultiplier × 0.90, 29.99m)`.

**Decision:** `Math.Max` floor enforcement directly in the fare calculation expression.

**Reason:** Applying the minimum fare as a single `Math.Max` guard is the least-surprising place to enforce the domain invariant and keeps the formula readable.

---

## 05 — AirportConstants (Single Source of Truth)

**Prompt:** Extract domestic/international classification to a shared `AirportConstants.cs`; add 2 India + 1 Dubai airports.

**AI Output:** Created `Core/Constants/AirportConstants.cs` with a `Dictionary<string, string>` (airport → country code) for LAX, JFK, ORD, DEL, BOM, DXB; `IsDomestic` compares country codes; both providers updated to call `AirportConstants.IsDomestic`.

**Decision:** Country-code dictionary rather than a per-country `HashSet`.

**Reason:** A country-code map scales to new airports without adding new sets per country, and the domestic check becomes a single equality comparison on the mapped values.

---

## 06 — FlightAggregator (Scatter-Gather)

**Prompt:** Create `FlightAggregator` implementing `IFlightAggregator`; use `Task.WhenAll`; wrap each provider call in its own `try/catch`; return empty collection on failure.

**AI Output:** Created `Infrastructure/Aggregators/FlightAggregator.cs`; projected `IEnumerable<IFlightProvider>` into parallel tasks via `Select`; caught per-provider exceptions with `LogError`; flattened results with `SelectMany`.

**Decision:** Per-provider `try/catch` inside `Task.WhenAll`, not a single outer catch.

**Reason:** A single outer catch would cancel all providers if one throws; individual catches provide fault isolation so partial results are still returned.

---

## 07 — DI Registration (Program.cs)

**Prompt:** Register `GlobalAirProvider`, `BudgetWingsProvider`, and `FlightAggregator` in `Program.cs`.

**AI Output:** Added `AddScoped<IFlightProvider, GlobalAirProvider>()`, `AddScoped<IFlightProvider, BudgetWingsProvider>()`, `AddScoped<IFlightAggregator, FlightAggregator>()`, `AddMemoryCache()` to `Program.cs`.

**Decision:** Both providers registered as `IFlightProvider` (multiple registrations); `IFlightAggregator` as `Scoped`.

**Reason:** ASP.NET Core resolves `IEnumerable<IFlightProvider>` automatically when multiple implementations are registered against the same interface, which is exactly what `FlightAggregator` expects.

---

## 08 — InMemoryBookingRepository

**Prompt:** Create `InMemoryBookingRepository` implementing `IBookingRepository`; use `IMemoryCache` and `ConcurrentDictionary` per Spec/CLAUDE.md.

**AI Output:** Created `Infrastructure/Repositories/InMemoryBookingRepository.cs`; lookup flight from cache at `flight:{flightId}`; generate 8-char booking reference from `Guid`; store record in `ConcurrentDictionary`; registered as `Singleton` in DI.

**Decision:** `Singleton` lifetime for the repository; cache key convention `flight:{flightId}`.

**Reason:** `ConcurrentDictionary` must persist across requests (state survives the HTTP lifetime), requiring `Singleton`; the cache key convention must match the key used by the controller when caching search results.

---

## 09 — FlightsController + Full DI Wiring

**Prompt:** Create `FlightsController.cs` with search, book, and get-booking endpoints; wire all DI in `Program.cs`.

**AI Output:** Created `Controllers/FlightsController.cs` — `POST /api/flights/search` (aggregates + caches each result for 30 min), `POST /api/flights/book` (404 if not cached, compute total fare), `GET /api/flights/bookings/{ref}` (404 if not found); `Program.cs` updated with `AddControllers`, `MapControllers`, `UseExceptionHandler`.

**Decision:** Cache each `FlightResult` individually at `flight:{flightId}` immediately after search.

**Reason:** Booking must validate that the flight was returned by a real prior search; caching on search ties booking eligibility to an active search session without a dedicated session mechanism.

---

## 10 — Global Error Handling + Structured Logging

**Prompt:** Implement error handling across all layers and log errors; see Spec.md and CLAUDE.md.

**AI Output:** Created `Infrastructure/Handlers/GlobalExceptionHandler.cs` implementing `IExceptionHandler`; returns RFC 9457 `ProblemDetails` with status 500 and a safe user-facing title; full exception detail logged server-side only; `LogWarning` for 404s in controller, `LogError` in aggregator per-provider catch; structured placeholders throughout (no string interpolation in log calls).

**Decision:** `IExceptionHandler` (ASP.NET Core 8 native) over middleware or filters; `UseExceptionHandler()` placed first in the pipeline.

**Reason:** `IExceptionHandler` integrates with `ProblemDetails` infrastructure natively and is registered via DI, keeping error handling testable and decoupled from the pipeline order of other middleware.

---

## 11 — useFlightSearch Hook

**Prompt:** Create `useFlightSearch.js` to consume the search API; see Spec/CLAUDE.md.

**AI Output:** Created `src/features/flight-search/hooks/useFlightSearch.js`; manages `results`, `loading`, `error` state; `search` wrapped in `useCallback`; parses RFC 9457 `title` field from error responses; clears previous results on new search.

**Decision:** `useCallback` with empty dependency array for the `search` function.

**Reason:** Stable function reference prevents unnecessary re-renders in consuming components that pass `search` as a prop or effect dependency.

---

## 12 — FlightSearch Component

**Prompt:** Create `FlightSearch.jsx` using `useFlightSearch`; see Spec/CLAUDE.md.

**AI Output:** Created `src/features/flight-search/components/FlightSearch.jsx`; AIRPORTS array (6 entries), mutual-exclusion dropdowns (origin disables matching destination), `min={TODAY}` date constraint, `useMemo` for client-side sort (price/duration/departure), `hasSearched` flag for empty-state message, `onBook(flight, passengers)` callback.

**Decision:** Client-side sort via `useMemo`; `TODAY` as a module-level constant.

**Reason:** Re-fetching on every sort change would waste API calls; spec explicitly requires client-side sorting to minimise API calls.

---

## 13 — PropTypes Enforcement

**Prompt:** Add PropTypes to `FlightSearch.jsx` and `BookingForm.jsx` for strict type safety.

**AI Output:** Added `FlightResultShape` (exported) and `FlightSearch.propTypes` in `FlightSearch.jsx`; added full `flight` shape and `onBack` PropTypes in `BookingForm.jsx`.

**Decision:** Export `FlightResultShape` from `FlightSearch.jsx` for reuse in `BookingForm.jsx` and `App.jsx`.

**Reason:** A single shared shape definition ensures prop contracts stay in sync across components that pass the same flight object without duplicating field declarations.

---

## 14 — App.jsx — View Routing

**Prompt:** Update `App.jsx` to mount `BookingForm.jsx` and manage search/booking view transitions.

**AI Output:** Updated `App.jsx` with `view` state (`'search'` | `'booking'`), `selectedFlight` state; `handleBook(flight, passengers)` merges `passengerCount` via spread before storing; `handleBack` resets both state values; renders `FlightSearch` or `BookingForm` conditionally.

**Decision:** Merge `passengerCount` into the flight object at the `App` level via spread.

**Reason:** `FlightResult` has no `passengerCount` field; merging at the app boundary keeps both child components unaware of each other's data shape while preserving the original flight record structure.

---

## 15 — useFlightBooking Hook

**Prompt:** Create `useFlightBooking.js` to consume the booking API; see Spec/CLAUDE.md.

**AI Output:** Created `src/features/flight-booking/hooks/useFlightBooking.js`; manages `booking`, `loading`, `error` state; `book` wrapped in `useCallback`; `POST /api/flights/book` with `{ flightId, cabinClass, passengerCount, leadPassenger }`; sets `booking` state on success.

**Decision:** Mirror the same state/hook pattern as `useFlightSearch` (loading/error/data + useCallback).

**Reason:** Consistent hook API across features reduces cognitive overhead and makes the pattern predictable for future hooks.

---

## 16 — BookingForm Component

**Prompt:** Create `BookingForm.jsx`; see Spec/CLAUDE.md.

**AI Output:** Created `src/features/flight-booking/components/BookingForm.jsx`; `DOCUMENT_CONFIG` switches label and regex between `National ID` (domestic) and `Passport Number` (international) based on `flight.isDomestic`; per-field validation on submit; errors cleared on change; `documentNumber.toUpperCase()` before API call; confirmation screen on successful booking.

**Decision:** `DOCUMENT_CONFIG` object keyed by `'domestic'`/`'international'`; validation regex scoped per config entry.

**Reason:** Keyed config object allows `docConfig = DOCUMENT_CONFIG[isDomestic ? 'domestic' : 'international']` to select the full label+pattern+hint tuple in one expression rather than branching three separate values.

---

## 17 — Button Core Component

**Prompt:** Extract reusable `Button.jsx` to `src/core/components/`; update `FlightSearch.jsx` and `BookingForm.jsx` to use it.

**AI Output:** Created `src/core/components/Button.jsx` with `variant` prop (`primary`|`success`|`ghost`|`text`); created `src/styles/button.module.css` with per-variant styles; stripped all visual button styles from `flight-search.module.css` and `flight-booking.module.css` (kept layout-only properties: `align-self`, `margin`); replaced all `<button>` elements in both components with `<Button>`; added `@core` alias to `vite.config.js`; sort buttons use `variant={sortBy === value ? 'primary' : 'ghost'}` eliminating the `sortBtnActive` conditional class.

**Decision:** `Button` owns all visual styles; feature CSS retains only layout positioning (`align-self: flex-end`, `margin-bottom`).

**Reason:** Centralising button visual styles prevents drift between identically intended buttons across features and makes variant changes a single-file edit.

---

## 18 — Global CSS Separation

**Prompt:** Separate global/application-level CSS into `global.css`; focus feature module CSS on feature-level styles only.

**AI Output:** Populated `src/styles/global.css` with CSS reset, `body` base styles, and `.app`/`.app-header`/`.app-logo`/`.app-main` shell classes (moved from `App.css`); updated `main.jsx` to import `@styles/global.css`; removed `import './App.css'` from `App.jsx`; cleared `App.css`; removed `font-family` from `.container` in both feature modules.

**Decision:** Single `global.css` as the sole non-module stylesheet; `main.jsx` as its import point.

**Reason:** Importing global styles at the entry point (`main.jsx`) guarantees they load before any component renders, and keeps `App.jsx` free of stylesheet side-effects.

---

## 19 — Date Min Constraint Bug Fix

**Prompt:** Date picker allows selecting past dates; should reflect user's local timezone.

**AI Output:** Replaced `new Date().toISOString().split('T')[0]` with a `localDateString()` helper using `getFullYear()`/`getMonth()`/`getDate()` (local date components); `TODAY` constant recomputed via the helper.

**Decision:** Derive date string from local date component getters, not `toISOString()`.

**Reason:** `toISOString()` converts to UTC before formatting, so users in UTC+ timezones receive yesterday's date as the `min` value, making past dates selectable.

---

## 20 — Prompt Log (This File)

**Prompt:** Read all session prompts and responses; create `prompts.md` with fields: prompt, ai output (brief), decision, reason (one sentence — technical, not stylistic).

**AI Output:** Created this file at the project root with one entry per session prompt, structured consistently.

**Decision:** Log stored at project root alongside `Spec.md` and `CLAUDE.md`.

**Reason:** Co-locating the prompt log with the spec and architecture guide keeps all project-level documentation discoverable in one place without polluting either the backend or frontend source trees.

---

## 21 — Controller SRP + FlightSearchService

**Prompt:** `FlightsController` violates SRP by handling both search and booking; split into `FlightsController` and `BookingsController`; move null checks and caching out of controllers into the service layer; add `IFlightSearchService`; record the skinny-controller rule in `SkyRoute.Server/CLAUDE.md`.

**AI Output:** Created `IFlightSearchService` + `FlightSearchService` (caching logic migrated from controller); created `BookingsController` (`POST /api/bookings`, `GET /api/bookings/{ref}`); reduced `FlightsController` to a single three-line `Search` action; created `NotFoundException`; updated `GlobalExceptionHandler` to map `NotFoundException` → 404 RFC 9457 response; updated `useFlightBooking` URL from `/api/flights/book` to `/api/bookings`; added skinny-controller and service-owns-error-handling rules to `SkyRoute.Server/CLAUDE.md`.

**Decision:** Services throw `NotFoundException` instead of returning null; `GlobalExceptionHandler` owns the null-to-404 mapping.

**Reason:** Pushing the null check into the service and the HTTP mapping into the exception handler means controllers never branch on return values, which is the only way to enforce the skinny-controller invariant across the whole codebase.

---

## 22 — Integration Tests + Test Doubles Reorganisation

**Prompt:** Add integration tests for `FlightsController` and `BookingsController` under `Integration/Controllers/`; extract all test doubles out of individual test files into shared `Stubs/` and `Fakes/` folders.

**AI Output:** Created `Fixtures/SkyRouteWebApplicationFactory.cs` (two-constructor pattern — public parameterless for `IClassFixture`, internal seeded constructor for empty-provider tests); created `Integration/Controllers/FlightsControllerTests.cs` (3 tests) and `Integration/Controllers/BookingsControllerTests.cs` (7 tests including cache-population helpers and RFC 9457 problem-details assertions); extracted all private nested test doubles into `Stubs/` (`StubProvider`, `StubFlightAggregator`, `StubFlightSearchService`, `StubBookingService`, `StubBookingRepository`, `StubMemoryCache`) and `Fakes/` (`FailingProvider`); added `Microsoft.AspNetCore.Mvc.Testing` package reference; added `public partial class Program {}` to `Program.cs`.

**Decision:** Two-constructor factory with a static `DefaultFlights` field; `IClassFixture` uses the parameterless constructor, custom-seeded tests instantiate the internal constructor directly.

**Reason:** xUnit's `IClassFixture<T>` calls the public parameterless constructor, so the default seed must be baked in there; the internal constructor provides a clean override path for the empty-provider edge case without coupling fixture setup to individual tests.

---

## 23 — Hook Unit Tests (Vitest — Initial Attempt)

**Prompt:** Add tests for `useFlightSearch` and `useFlightBooking` hooks under `__tests__/unit/hooks/`; create test utilities if required.

**AI Output:** Created `vitest.config.js` (separate from `vite.config.js` to avoid SSL certificate generation at test-run time); added `vitest`, `@testing-library/react`, and `jsdom` to `devDependencies`; added `test` and `test:watch` scripts; created `src/__tests__/utils/fetchMock.js` (`createOkResponse`, `createErrorResponse`, `createNetworkError`); replaced placeholder test files for `useFlightSearch` and `useFlightBooking` with 10 tests each covering initial state, loading toggling, success, request format, and all error paths using `vi.fn()` for fetch mocking.

**Decision:** Separate `vitest.config.js` pointing to `jsdom` environment; `global.fetch = vi.fn()` reset in `beforeEach`.

**Reason:** The main `vite.config.js` runs SSL certificate generation logic at config-load time which fails in CI; a separate config file isolates test configuration from the dev-server setup.

---

## 24 — Revert Vitest → Jest

**Prompt:** Revert Vitest; rewrite hook tests using the Jest testing framework.

**AI Output:** Deleted `vitest.config.js`; created `babel.config.cjs` (`@babel/preset-env` + `@babel/preset-react` with `runtime: automatic`) and `jest.config.cjs` (`jest-environment-jsdom`, `moduleNameMapper` for path aliases, `testMatch` scoped to `*.test.js` to exclude utility files); replaced `vitest` with `jest`, `babel-jest`, `@babel/core`, `@babel/preset-env`, `@babel/preset-react`, `jest-environment-jsdom` in `devDependencies`; updated both hook test files — removed `import { ... } from 'vitest'` (Jest injects globals) and replaced all `vi.fn()` with `jest.fn()`; 20 tests pass.

**Decision:** `babel.config.cjs` and `jest.config.cjs` use `.cjs` extension; `testMatch` restricted to `*.test.js`.

**Reason:** The project sets `"type": "module"` in `package.json`, so config files without a `.cjs` extension are parsed as ESM and cannot use `module.exports`; restricting `testMatch` prevents Jest from treating `fetchMock.js` and other utility files inside `__tests__/` as test suites.
