# CLAUDE.md (Frontend: skyroute.client)

Specific architectural rules, coding standards, and component boundaries for the React 18 Vite client.
Cross-cutting rules (domain values, sorting rules, dynamic validation rule) live in the root `CLAUDE.md`.

---

## Commands

```bash
npm run dev      # https://localhost:51560 — development server
npm run lint     # Check ESLint
npm run build    # Compile static production files
npm run preview  # Preview production build locally
```

---

## Coding standards

### React 18 syntax

- **Pure JavaScript** — write all components in `.jsx` or `.js` — do NOT use TypeScript
- **Component defaults** — use the `prop-types` package

- **Custom hooks** — never put raw `fetch` logic inside UI rendering files; abstract all side effects, state, and API calls into standalone custom hooks (e.g. `useFlightSearch.js`, `useBooking.js`)

### Style and directory

- **CSS Modules** — all component styles live in `src/styles/` using `.module.css` naming convention
- **Path alias** — use the `@styles` Vite alias to import stylesheets; never use deep relative paths:

```js
import styles from '@styles/flight-search.module.css';
```

- **Derived state** — do not store in `useState` or compute in `useEffect` values that can be derived directly during render (e.g. checking if a route is international by comparing origin/destination country codes)

### Communication

- Use relative paths for all API calls — `fetch('/api/flights/search')` — let the Vite proxy handle routing to the backend
- Never hardcode `localhost` URLs in fetch calls

---

## Feature structure

```
src/features/
├── flight-search/
│   ├── components/   ← search form, results list, flight card
│   └── hooks/        ← useFlightSearch.js
└── flight-booking/
    ├── components/   ← booking form, passenger form, summary
    └── hooks/        ← useBooking.js

src/core/components/  ← shared/reusable UI components
src/styles/           ← all .module.css files
```

---