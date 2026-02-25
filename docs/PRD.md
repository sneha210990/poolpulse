# Product Requirements Document (PRD - V1)

**Title:** `PoolPulse — PRD v1`

**Owner:** Sneha Ganapavarapu

**Date:** 12 Feb 2026

**Version:** v1 (Pilot)

## 1. Summary

PoolPulse is a privacy-first mobile app that helps swimmers decide **when to go** and **which lane type to use** by showing **real-time busyness** for Edinburgh Leisure pools. v1 focuses on lane-level busyness by **lane type** (Fast / Medium / Slow) using **anonymous community check-ins** that automatically age out of the live window to stay accurate.

> **Key principle:** No surveillance. No cameras. No location tracking. Data is aggregated and time-bucketed.
> 

**Pilot pools:** Leith Victoria, Glenogle, Royal Commonwealth.

**Primary value:** Reduce wasted trips + frustration caused by unexpectedly crowded lanes.

## 2. Problem

Swimmers can’t reliably predict:

- whether a pool is open or running a lane session vs family/casual session
- which lane types (fast/medium/slow) are overcrowded

This causes:

- wasted travel time
- lane conflict and poor experience
- reduced consistency in training

## 3. Goals

- Show **open/closed** for pilot pools
- Show **lane-type busyness** (Fast/Medium/Slow) for Lane Swim and Casual w/ lanes
- Enable **anonymous contributions** with basic anti-abuse throttling
- Keep it **privacy-first** and transparent (open source)

### Non-goals (v1)

- Perfect headcounts
- Edinburgh Leisure integration
- Automatic timetable scraping/parsing (manual config OK)
- Payments/monetisation

## **4. Assumptions & constraints**

- Data quality depends on community participation; v1 prioritises *directional usefulness* over exact accuracy.
- Lane configurations may change during a session (lifeguard discretion, lessons, clubs).
- Users can view and contribute without login in the current web beta; anti-abuse controls are applied at product/infrastructure level.
- v1 uses manual configuration for pool hours/session modes; no automated timetable parsing.

## 5. Users

**Primary:** Regular swimmers in Edinburgh who do lane sessions (training/fitness).

**Secondary:** Casual swimmers who still want a quiet lane.

## 6. User journeys

### Browse (read-only)

1. Open app → Pools list
2. See open/closed + overall busyness badge (derived)
3. Tap a pool → view lane-type busyness (read-only)

### Contribute (anonymous)

1. Tap “Check in”
2. Choose lane type: Fast / Medium / Slow (and optional: “Casual lane swim” vs “Lane swim”)
3. See lane busyness screen
4. Optionally: Move lane / Leave

## 7. Scope (Must / Should / Won’t)

### Must (P0)

- Pools list (3 pools) + open/closed indicator (manual schedule acceptable)
- View lane busyness without login
- Anonymous check-in (no account required)
- Check-in lane type (Fast/Medium/Slow)
- Use a short-lived activity window of 75 minutes for live busyness calculations
- Lane busyness labels (Quiet/OK/Busy) + last updated time
- Leave / Move lane actions

### Should (P1)

- Casual lanes mode (open area + limited lanes indicator)
- Confidence indicator (Low/Med/High)
- Simple “Report: lanes not available right now” toggle

### Won’t (v1)

- Lane numbering / exact rope map
- Live integration with EL systems
- Push notifications

## **8. Functional requirements (v1)**

- Users **shall** be able to view pool and lane busyness without authentication.
- Users **shall** be able to submit anonymous check-ins in the web beta (no login required).
- The system **shall** allow only **one active check-in per user per pool** at a time.
- Users **shall** be able to update lane type via **Move lane** without creating a second active session.
- The system **shall** auto-expire check-ins after **75 minutes** and exclude expired check-ins from busyness.
- The UI **shall** display a **last updated** timestamp for each lane type.
- The UI **shall** show **ranges/labels** (Quiet/OK/Busy) rather than exact headcounts.

## **9. Non-functional requirements**

- **Privacy:** No GPS tracking, no camera data, no public display of user-level activity; only aggregated busyness is shown.
- **Security:** Supabase-backed storage with anti-abuse throttling and moderation safeguards for check-in attempts.
- **Performance:** Pool and lane busyness should load in **<2 seconds** on typical mobile data.
- **Reliability:** If busyness cannot load, app should show a friendly fallback (“Data temporarily unavailable”).
- **Accessibility:** Tap targets ≥ 44px, readable contrast, clear labels for lane types.

## 10. Busyness model (v1)

**Overall pool busyness (derived):** sum of active check-ins across Fast/Medium/Slow, mapped to Quiet/OK/Busy.

**Input:** Anonymous check-ins by lane type.

**Active check-in window:** 75 minutes.

**Output:** Per lane type:

- Quiet: 0–2 active
- OK: 3–5 active
- Busy: 6+ active
    
    Show **ranges**, not exact people counts.
    
    ## **11. Data model**
    
    **Entities**
    
    - **Pool:** id, name, address, open_hours (manual), status_override (optional)
    - **Check-in:** id, pool_id, user_id, session_type (lane/casual), lane_type (fast/med/slow), created_at, expires_at
    - **Busyness (derived):** pool_id, lane_type, active_count, label, last_signal_at
    
    **Notes**
    
    - Busyness is calculated from non-expired check-ins only.
    - Labels are mapped from active_count using v1 thresholds.

## 12. Data & privacy

- No cameras, no surveillance
- No location tracking
- Optional email may be provided only in the feedback form for follow-up (not required for check-ins)
- Public display is aggregated by lane-type + time window
- Open-source algorithm + schema

## 13. Success metrics (pilot)

- 50 check-ins within 14 days
- 10 repeat contributors
- ≥ 60% of surveyed users say it helped them decide when/where to swim
- Median time-to-check-in < 30 seconds

## **14. Analytics / instrumentation (v1)**

Track these events (anonymous, aggregated):

- `view_pools_list`
- `view_pool_page`
- `tap_checkin`
- `checkin_created`
- `move_lane`
- `leave_pool`
- `busyness_refreshed`
- `report_no_lanes` (if implemented)

Pilot survey prompt (in-app, optional): “Did this help you decide when/where to swim?” (Yes/No)

## 15. Risks & mitigations

- **Low adoption →** allow read-only browsing without login friction; seed early users; add QR posters later
- **Inaccurate data →** ranges + confidence + “last updated”; auto-expiry; easy “leave/move”
- **Lane setup differs →** label “lane setup may vary”; add quick crowd confirmation later

## **16. Edge cases**

- **No lanes right now:** For family swim/classes/general swim with no lanes, the pool page should show **“No lanes available”** and hide lane-type cards.
- **Casual with limited lanes:** Show lane-type cards with a banner: “Casual swim with lanes — setup may vary.”
- **User forgets to leave:** Auto-expiry prevents ghost swimmers.
- **User changes pools:** Starting a check-in at a new pool should end the old one (or block with a prompt).
- **Low data:** If there are zero recent check-ins, show “Not enough data” + last update.

## 17. Open questions

- How do we represent Casual w/ lanes (open area + fewer lanes) in v1 UI?
- Should we add “pace category” (slow/med/fast swimmer) later?
- What’s the best expiry time: 60/75/90 minutes?

## **18. Pilot launch plan**

- **Week 1:** Private beta with 10–20 swimmers across the 3 pools; collect feedback on friction + accuracy.
- **Week 2:** Expand to 50–100 users; add QR posters near entrances if allowed.
- Review metrics weekly; adjust expiry time and thresholds based on observed behaviour.

## 19. Links

- Figma:
- GitHub repo:
- Supabase project:
