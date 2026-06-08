# Technical Specification: SkyRoute Flight Booking

## 1. Requirements Addressed
* **Flight Search:** Users can search routes across 6 hardcoded airports, selecting dates, passengers (1-9), and cabin class.
* **Provider Logic:** Mocked two distinct airlines using the Strategy Pattern.
  * *GlobalAir:* Base fare + 15% surcharge.
  * *BudgetWings:* Base fare - 10% discount (minimum $29.99 limit enforced).
* **UI Display & Sorting:** Shows total price and price per person. Sorting (price, duration, time) happens locally in the UI to minimize API calls. Handled loading and empty states.
* **Dynamic Validation:** Form label and validation regex dynamically switch between 'Passport Number' (International) and 'National ID' (Domestic) based on route origin and destination.

## 2. Assumptions & Trade-offs
* **Infrastructure Setup:** To make the app easy to run locally for review, I used `.NET IMemoryCache` to mock Redis and an in-memory concurrent dictionary to mock the database. The app uses the Repository pattern, so swapping to a real DB just requires updating the DI container.
* **Scope Limits:** Authentication, session persistence, and live currency conversion were left out to focus on the core aggregator concurrency and domain logic.

## 3. Architecture & Tech Stack
* **Backend:** .NET 8 Web API. 
  * Used `Task.WhenAll` (Scatter-Gather pattern) to hit flight providers concurrently so search latency is only as slow as the slowest API.
  * Used `IExceptionHandler` for standardized error responses.
  * Provider logic is decoupled via `IFlightProvider` so new airlines can be added without touching the core search service.
* **Frontend:** React 18 (JavaScript).
  * Used CSS Modules for component-scoped styling to prevent global CSS conflicts.
  * Handled dynamic form validation natively without heavy third-party libraries.