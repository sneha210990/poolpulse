# Architecture

## Current implementation (GitHub Pages web app)

### Frontend
- A static SPA served from `index.html` on GitHub Pages.
- UI is rendered with React 18 (UMD build) in the browser.
- Styling is provided via Tailwind CSS CDN.
- Icons are provided by Lucide (UMD).

### Data layer
- Supabase is used as the backend service.
- Main tables currently used by the frontend:
  - `checkins` (read/write): stores anonymous lane check-ins.
  - `feedback` (write): stores feedback submissions (`type`, `message`, optional `contact`).
- The client computes lane busyness from recent check-ins in a time window (currently 75 minutes).

### Runtime flow
1. Frontend loads pool metadata and opening-hours config from hardcoded constants.
2. Frontend fetches recent `checkins` from Supabase.
3. Frontend aggregates by `pool_id` + `lane` to derive lane labels and freshness.
4. Users can submit new check-ins and feedback directly from the UI.

### Deployment
- Source is stored in GitHub.
- Site is published via GitHub Pages.
- Backend is hosted on Supabase.

## Security and abuse controls
- Current client-side anti-spam cooldown is enforced with local storage for UX throttling.
- Authoritative anti-abuse/rate-limiting should be enforced server-side (RLS + functions/policies), because client-only controls are bypassable.

## Future target state
- Move from single-file browser-transpiled app to build-based project (e.g., Vite).
- Split UI into components/modules for maintainability.
- Add explicit server-side abuse checks and clearer data retention controls.
