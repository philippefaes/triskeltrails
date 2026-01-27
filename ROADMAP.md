# TODO — Triskel Trails MVP

## 7. POIs without noise (value, not clutter)

### 7.1 Goal
Add meaningful POI awareness while preserving a calm, minimal interface.

### 7.2 Data

7.2.1 ✅ Create `pois.json` (read-only, stored in assets)  
- Fields:
  - `id`
  - `type` (`water`, `bailout`, `viewpoint`, etc.)
  - `name`
  - `lat`
  - `lon`
  - `stage_id`

7.2.2 ✅ Precompute `poi_route_idx` (nearest index on route polyline)  

- One-time computation on app load  
- Stored in memory only (no persistence)

### 7.3 Logic

7.3.1 ✅ Determine **current stage** from `progress_idx`

7.3.2 ✅ Compute **distance along route to each POI**  

7.3.2.bis ✅ Compute **distance to end of entire trail** and display in map-component

7.3.3 ✅ Filter POIs  

Only show PoIs on the map if:

- PoI is in the current stage (Same `stage_id`)
- PoI is in front of us (distance to poi is > 0 )
- PoI is not too far (distance < 2km)

Have a debug flag so that we can show all PoIs during development anyway.

Implemented: Smart hybrid approach — keep markers alive while in scope, create/destroy on boundary crossings.

7.3.4 ✅ Select **next relevant POI**  

- POI with minimum positive `dist_to_poi_m`

### 7.4 ✅ UI — Text

7.4.1 Show **exactly one** POI in the UI  

7.4.2 If no POI ahead in the current stage  

- Show nothing (silence is acceptable)

### 7.5 ✅ UI — Map

7.5.1 ✅ Show POI markers only if one of the following is true  

- POI is in current stage **AND**
- `dist_to_poi_m <= 2000`

7.5.2 ✅ Always show POIs of type `bailout`

7.5.3 ✅ (Dev only) Add debug toggle  

- “Show all POIs”

### 7.6 ✅ Explicit non-goals (Step 7)

7.6.1 No POI lists  
7.6.2 No filtering UI  
7.6.3 No category selection  
7.6.4 No tap interactions

## 8. Route awareness & calm behavior

### 8.1 ✅ Distance to route (MVP)

8.1.1 Compute `distanceToRouteM` as haversine to nearest route point.  
8.1.2 (Later) Replace with nearest point on segment for better accuracy.  

### 8.2 ✅ State machine

8.2.1 Compute `effectiveDistanceM = distanceToRouteM - gpsAccuracyM`.  
8.2.2 Define:

- ON_ROUTE: `effectiveDistanceM <= 50`  
- NEAR_ROUTE: `50 < effectiveDistanceM <= 250`  
- OFF_ROUTE: `effectiveDistanceM > 250`  

### 8.3 Behavior per state

8.3.1 ON_ROUTE:

- show stage + distances + next POI  
- map auto-follow enabled (`panTo`)  

8.3.2 NEAR_ROUTE:

- show stage + distances + next POI  
- show subtle warning text (“GPS uncertain / near route”)  
- map auto-follow disabled  

8.3.3 OFF_ROUTE:

- show only off-route message + distance to route  
- hide stage distance + POI info  
- map auto-follow disabled  
- show button “Show route” (pan/zoom to nearest route point)  

### 8.4 Reduce flicker

8.4.1 Only update UI when route state changes OR progress changes beyond a threshold.  
8.4.2 Consider throttling GPS updates to UI (e.g., 1–2s) while still collecting fixes.  

### 8.5 Non-goals

8.5.1 Do not implement rerouting.  
8.5.2 Do not implement turn-by-turn.  
8.5.3 Do not add alerts/notifications.  
8.5.4 Do not add settings/config screens.  

---

## 9. Acceptance criteria (MVP sanity check)

9.1 App never shows confident stage distances in OFF_ROUTE.  
9.2 UI shows at most one stage and one POI.  
9.3 The app does not require any user configuration.  
9.4 With 0 POIs, the app remains calm and usable.  
9.5 GPS denial gracefully falls back to a fixed demo location.  
