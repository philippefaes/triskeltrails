# PROJECT_BRIEF — Kumano Kodo Companion (MVP)

## 1) One-sentence pitch

A calm, minimalist trail companion for a single pilgrimage route: it shows where you are on the route, which **stage** you are in, and a few meaningful distances — with zero configuration.

## 2) Product intent (optimize for)

1. **Calm / low cognitive load** while walking.
2. **Trust**: never show confident info when it’s likely wrong.
3. **Zero setup**: no route search, no stage planning, no user choices.
4. **Read-only**: the app consumes curated route data; no user data storage.

## 3) Vocabulary (frozen terminology)

- **Route**: one curated line (polyline) representing the chosen official-like track.
- **Stage**: a segment of the route (route index range). (Never call it “day”.)
- **POI**: a point of interest near/on the route (water, bailout, shrine, etc.).
- **Distance**: always **along the route**, not crow-fly (except debug).

## 4) Non-negotiables

1. No user configuration (no picking end-of-day, no “choose your stage”, no route search).
2. No accounts, no authentication.
3. No local/remote CRUD database.
4. UI shows at most:
   - one current stage
   - one “next POI”
5. Silence is acceptable (if no POI, show nothing extra).
6. The app must react differently when the user is off-route.

## 5) MVP scope

### In scope (MVP)

1. Map view with:
   - route polyline
   - user location marker (GPS or fallback)
2. Determine route progress from GPS:
   - find nearest point (or segment) on route
   - compute `progress_idx` / `progress_m`
3. Stage detection from `stages.json`:
   - `start_idx <= progress_idx <= end_idx`
4. Distances (along route):
   - distance to end of current stage
   - distance to end of route
5. POI logic:
   - compute “next POI” ahead in current stage
   - show exactly one “next POI” text line
6. Route state machine:
   - ON_ROUTE / NEAR_ROUTE / OFF_ROUTE
   - change UI + map behavior accordingly

### Explicitly out of scope (MVP)

- Turn-by-turn navigation
- Rerouting
- Lists of POIs
- Search
- Filters
- Community / social
- Reviews, ratings, comments
- Gamification
- Notifications / sounds / vibration
- Offline packs / tile downloads (later step)

## 6) Core runtime pipeline (data flow)

1. Load read-only assets:
   - `route.json` (polyline)
   - `stages.json` (index ranges)
   - `pois.json` (POIs)
2. Precompute:
   - `cumDistM[]` cumulative distance along route per point
3. Start GPS watch:
   - each update: `(lat, lon, accuracyM, timestamp)`
4. Compute:
   - nearest route point/segment → `progress_idx`
   - distance to route → `distanceToRouteM`
   - route state (ON/NEAR/OFF) using thresholds + accuracy
5. If state is ON_ROUTE or NEAR_ROUTE:
   - current stage
   - dist to stage end
   - dist to route end
   - next POI ahead in stage
6. Update UI:
   - ON_ROUTE: follow user (panTo)
   - NEAR_ROUTE: no follow; subtle warning
   - OFF_ROUTE: replace stage view with off-route message

## 7) Route state machine (must be implemented)

Compute:

```
effectiveDistanceM = distanceToRouteM - accuracyM
```

Thresholds (MVP defaults):

- **ON_ROUTE**: `effectiveDistanceM <= 50`
- **NEAR_ROUTE**: `50 < effectiveDistanceM <= 250`
- **OFF_ROUTE**: `effectiveDistanceM > 250`

Behavior:

- ON_ROUTE:
  - show stage + distances + next POI
  - map follows user
- NEAR_ROUTE:
  - show stage + distances + next POI
  - show “GPS uncertain / near route”
  - map does NOT follow
- OFF_ROUTE:
  - show “You are not on the route” + distance to route
  - hide stage distance + POI info
  - map does NOT follow
  - one button: “Show route” (pan/zoom to nearest route point)

## 8) Distance policy (important)

- All user-facing distances are **along-route** distances:
  - use `cumDistM` differences once `progress_idx` is known
- Crow-fly (haversine) may be used only for:
  - computing `distanceToRouteM` (MVP approximation)
  - debug displays (optional)

## 9) POI policy (minimalist)

1. UI shows **one** POI: “next relevant POI”.
2. “Next POI” means:
   - same `stage_id` as current stage
   - ahead on route: `poi_idx > progress_idx`
   - minimal positive `cumDistM[poi_idx] - cumDistM[progress_idx]`
3. Map marker visibility:
   - show POIs in current stage only if within 2 km along route (`<= 2000m`)
   - always show `bailout` POIs
4. Dev-only debug toggle may show all POIs.

## 10) Current status (as of now)

- Steps 1–7 implemented:
  - Angular app skeleton
  - Leaflet map
  - route polyline
  - GPS marker / fallback
  - stages.json + current stage inference
  - distance to end (via along-route)
  - POIs present and shown on map (currently only 2)

## 11) Next actions (top 10, numbered)

1. Implement route state machine (ON/NEAR/OFF) and UI behavior changes.
2. Compute `distanceToRouteM` (MVP: nearest point haversine).
3. Add “Show route” button for OFF_ROUTE.
4. Add “next POI” selection logic (ahead in stage, min dist).
5. Restrict POI markers by visibility policy (stage + 2km, plus bailout).
6. Add dev-only toggle “Show all POIs”.
7. Reduce UI to max 1 stage + 1 POI line in all states.
8. Prevent flicker: only update UI when state changes significantly.
9. Add a small “Follow me” toggle (optional, default ON only in ON_ROUTE).
10. Document a single route variant as “MVP route pack v1” (curation later).

## 12) Anti-features (do not add)

- POI lists
- Search
- Route planning / itinerary builder
- User accounts
- Editable notes
- Rerouting / turn-by-turn
- Social sharing
- Gamification
- Ads (not for MVP)
