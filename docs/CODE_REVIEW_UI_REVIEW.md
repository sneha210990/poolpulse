# Code Review + UI Review (2026-02-25)

## Scope
- Repository review of the static web app and project docs.
- UI review against deployed site: https://sneha210990.github.io/poolpulse/

## High-priority findings
1. **Privacy-policy mismatch with implemented feedback collection**
   - The app includes an optional email field in feedback and sends it to Supabase (`feedback.contact`), which is personal data.
   - The in-app privacy copy says no emails are collected.
   - Recommendation: update privacy text to explicitly document optional feedback email processing and retention, or remove email capture.

2. **Client-side-only anti-spam controls are bypassable**
   - Check-in throttling relies on `localStorage` (`lastCheckIn`) which can be cleared or bypassed.
   - Recommendation: add server-side rate limiting / abuse protection in Supabase (RLS policies, Edge Function, IP/device heuristics).

3. **Architecture docs are incomplete / stale**
   - `docs/docs/ARCHITECTURE.md` is truncated and not actionable.
   - Recommendation: add a current architecture overview including frontend runtime model, Supabase schema, RLS assumptions, and deployment path.

## Medium-priority findings
1. **Single-file app structure harms maintainability**
   - Main app logic, privacy/terms content, and all views are embedded in one large HTML file with in-browser Babel transpilation.
   - Recommendation: move to build-based React app (Vite/Next) and split by components/modules.

2. **In-browser transpilation + multiple CDN dependencies increase runtime risk**
   - React, ReactDOM, Babel, Tailwind, Lucide, Supabase are loaded from CDNs at runtime.
   - Recommendation: pin versions and bundle dependencies during build; avoid shipping Babel in production.

3. **Data-model drift vs PRD**
   - PRD describes OTP-verified contribution and 75-minute expiry semantics, while current implementation uses anonymous check-ins and a 3-hour window.
   - Recommendation: update PRD and privacy docs to match current product behavior or prioritize feature parity.

## UI review summary
### Strengths
- Clear visual hierarchy and approachable onboarding story.
- Good use of card grouping and lane-state summaries.
- Mobile layout mostly holds together and keeps core CTA visible.

### UX/A11y issues
1. **Small text on mobile in cards/list sections**
   - Some pool card metadata and supporting copy render near the lower readability threshold on small screens.
   - Recommendation: raise minimum body size and line-height for metadata blocks.

2. **Clickable cards implemented as `<div onClick>`**
   - Limits keyboard semantics and assistive tech discoverability.
   - Recommendation: use semantic buttons/links with focus-visible states.

3. **Color-dependent status messaging**
   - OPEN/CLOSED and lane busyness rely heavily on color + emoji.
   - Recommendation: ensure textual labels remain primary and verify contrast targets.

4. **Long homepage before reaching interactive pool list on mobile**
   - The “View All Pools and Check in” CTA is clear, but users still scroll through narrative sections.
   - Recommendation: add sticky quick-jump chips or reduce hero/intro height on mobile.

## Suggested next steps (priority order)
1. Resolve privacy-policy / data-processing mismatch.
2. Implement server-side anti-abuse controls for check-ins.
3. Refresh architecture + product docs for current behavior.
4. Plan incremental refactor from single-file app to componentized build pipeline.
5. Run automated accessibility checks (axe/Lighthouse) and remediate top issues.
