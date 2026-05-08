# AGENTS.md — Tesla Destination Club

## Project Overview

Tesla Destination Club is a booking and queue management app for Tesla destination chargers in Malaysia. Users can book time slots at charger locations, view live queues, and share bookings via WhatsApp. Built with **SvelteKit 5 (runes mode)** on the frontend and **Firebase** (Firestore + Cloud Functions v2) on the backend.

The app is a client-rendered SPA — Firebase Hosting serves the SvelteKit-built client with all rewrites going to `index.html`. There is no SSR/server-side logic in SvelteKit itself; all backend logic lives in Firebase Cloud Functions.

## Commands

### Frontend (root)

```bash
npm run dev          # Start Vite dev server
npm run build        # Production build → .svelte-kit/output/client
npm run preview      # Preview production build
npm run check        # TypeScript check via svelte-check
```

### Cloud Functions (functions/)

```bash
cd functions
npm run lint         # ESLint
npm run build        # TypeScript compile → functions/lib/
npm run serve        # Build + start Firebase emulators (functions only)
npm run deploy       # Deploy functions to Firebase
```

### Firebase

```bash
firebase deploy                          # Deploy everything (hosting + functions + rules)
firebase deploy --only hosting           # Deploy frontend only
firebase deploy --only functions         # Deploy cloud functions only
firebase emulators:start                 # Start all emulators
```

Firebase project: `tesla-destination-club` (set in `.firebaserc`)

## Architecture

### Two Separate Codebases

The project has **two independent TypeScript compilations**:

1. **Frontend** (`src/`): SvelteKit + Vite. Uses `$lib` alias for `src/lib/`. Compiled by Vite/SvelteKit.
2. **Backend** (`functions/src/`): Node.js Cloud Functions. Compiled by `tsc` to `functions/lib/`. Uses `firebase-admin` (server SDK) and `firebase-functions` v2.

They share **no code** — types/models are duplicated (e.g., `Charger`, `Booking` interfaces exist independently in both codebases). If you add a field to a model, update it in both places.

### Routing

SvelteKit file-based routing under `src/routes/`:

- `/` — Landing page (public)
- `/login` — Auth page (public)
- `/(app)/` — Authenticated group with shared nav layout; redirects to `/login` if unauthenticated
  - `/(app)/chargers` — Charger list
  - `/(app)/chargers/[id]/book` — Booking calendar for a specific charger
  - `/(app)/chargers/[id]/queue` — Live queue view for a specific charger
  - `/(app)/bookings` — User's booking history

### Data Flow

**Firestore schema:**
```
chargers/{chargerId}              — Charger documents
  └── bookings/{bookingId}        — Bookings as a subcollection
```

**Write path:** Client → `httpsCallable` (Cloud Function) → Firestore. Clients **cannot write directly** to Firestore — all mutations go through Cloud Functions (`createBooking`, `cancelBooking`). Firestore rules deny all client-side writes to bookings.

**Read path:** Client → Firestore SDK directly. Authenticated users can read chargers and bookings. Real-time updates use `onSnapshot` listeners.

**Auth state:** Managed in `src/lib/firebase/auth.svelte.ts` via `$state` runes — a module-level singleton pattern. The auth guard in `(app)/+layout.svelte` redirects to `/login` if no user.

### Firebase Client Initialization

`src/lib/firebase/client.ts` initializes Firebase with config from `VITE_*` environment variables, falling back to hardcoded values (the prod config). Emulators are auto-connected in dev when the corresponding `VITE_*_EMULATOR_HOST` env vars are set.

## Key Patterns & Conventions

### Svelte 5 Runes Mode

The project uses **Svelte 5 runes mode** (enforced in `svelte.config.js`). This means:

- Use `$state()`, `$derived()`, `$effect()`, `$props()` — not legacy `let`, `$:`, or `export let`
- Component props: `let { children } = $props()`
- Reactive state: `let x = $state(initialValue)`

### Firebase Data Hooks Pattern

The `firestore.svelte.ts` file exports factory functions (not Svelte stores) that return objects with reactive getters. Pattern:

```typescript
export function useBookings(chargerId: string, date: string) {
    let bookings = $state<Booking[]>([]);
    let loading = $state(true);
    // ...
    function subscribe() { /* onSnapshot listener */ }
    function stop() { /* cleanup */ }
    return {
        get bookings() { return bookings; },
        get loading() { return loading; },
        subscribe,
        stop
    };
}
```

Callers use `onMount` to call `.subscribe()` and must call `.stop()` to clean up listeners.

### Tailwind CSS v4

Uses Tailwind v4 with the `@tailwindcss/vite` plugin. CSS is configured entirely in `src/app.css` using `@theme` blocks and `@utility` for custom animations. No `tailwind.config.js` file exists.

**Design tokens** are CSS custom properties defined in `app.css`:
- `--color-tesla-red`, `--color-accent-blue`, `--color-accent-green` — brand colors
- `--color-surface`, `--color-surface-elevated`, `--color-surface-overlay`, `--color-surface-muted` — backgrounds
- `--color-text-primary`, `--color-text-secondary`, `--color-text-muted` — text
- `--color-border`, `--color-border-subtle` — borders
- `--font-display` (Sora), `--font-body` (DM Sans) — typography

**Dark mode** is class-based (`.dark` on `<html>`). Light is default; dark mode is toggled via `src/lib/theme.svelte.ts`. The inline script in `+layout.svelte` prevents flash of wrong theme.

### Cloud Functions (Backend)

All functions use Firebase Cloud Functions v2 (`onCall` pattern). The functions module uses double quotes (Google ESLint config) and compiles to `functions/lib/`.

**Exported functions:**
- `createBooking` — Creates a booking with validation (overlap check, user limit of 1 active booking, max 120 min, max 7 days ahead)
- `cancelBooking` — Cancels a pending booking (owner only)

**Business rules enforced server-side:**
- Booking duration: 15–120 minutes
- Max advance booking: 7 days
- One active booking per user across all chargers
- Port concurrency check against `totalPorts` on the charger document

### Component Conventions

- Components live in `src/lib/components/` and are PascalCase `.svelte` files
- Shared UI component: `CoreButton.svelte` handles variant/size styling and can render as `<a>` (via `href`) or `<button>`
- Calendar components (`CalendarGrid`, `CalendarSelection`, `CalendarEvent`) handle the time-slot picker UI
- Calendar math utilities live in `src/lib/calendar-helpers.ts`

### Firestore Indexes

Defined in `firestore.indexes.json`. Two composite indexes exist for the `bookings` subcollection:
1. `startTime ASC, endTime ASC, status ASC` — for overlap queries in `createBooking`
2. `userId ASC, startTime DESC` — for user booking history

### Environment Variables

Frontend uses Vite env vars (`VITE_*`):
- `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` — Firebase config (fallbacks hardcoded for prod)
- `VITE_FIREBASE_AUTH_EMULATOR_HOST` — Auth emulator URL
- `VITE_FIREBASE_FIRESTORE_EMULATOR_HOST` — Firestore emulator host (port 8080 hardcoded)

## Gotchas

- **Firestore `startTime`/`endTime` are ISO strings**, not Firestore Timestamps. The Cloud Functions store `start.toISOString()` and queries use string comparison. This works because ISO 8601 strings sort lexicographically.
- **`useUserBookings` does a client-side N+1 query** — it fetches all chargers, then queries each charger's bookings subcollection individually. This is a known inefficiency due to Firestore's subcollection structure.
- **The `PhysicalQueuer` type is referenced in `firestore.svelte.ts` but not fully defined in the model files** — the `reportPhysicalQueuer` and `yieldBooking` cloud functions are called from the client but not implemented in `functions/src/index.ts` yet.
- **`functions/tsconfig.json` uses `module: "NodeNext"`** while the root `tsconfig.json` uses SvelteKit's config with `moduleResolution: "bundler"` — these are intentionally different.
- **Functions ESLint uses double quotes** (`"quotes": ["error", "double"]`) while the frontend codebase uses single quotes (Svelte/Prettier convention).
- **No test framework is configured** — there are no tests in the project currently.
- **`.npmrc` has `engine-strict=true`** — Node.js version must match `functions/package.json` engines field (`node: "24"`).
