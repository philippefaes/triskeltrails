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

### 8.1 Goal

Make the app react intelligently when the user is near, on, or off the route — without increasing cognitive load.

### 8.1.1 Pan to current location

Button in the top of the map to pan/zoom to the user's location. Only show this button if the location is known. This is a standard feature in many map applications.

### 8.2 Route state machine

8.2.1 Define three route states  

- **ON_ROUTE**
  - `effectiveDistance <= 50 m`
- **NEAR_ROUTE**
  - `50 m < effectiveDistance <= 250 m`
- **OFF_ROUTE**
  - `effectiveDistance > 250 m`

8.2.2 Compute effective distance  

effectiveDistance = distanceToRouteM - gpsAccuracyM

### 8.3 Behaviour per route state

#### 8.3.1 ON_ROUTE

8.3.1.1 Show:
- Current stage
- Distance to stage end
- Next POI (if available)

8.3.1.2 Map behaviour
- Auto-follow user position (`panTo`)

#### 8.3.2 NEAR_ROUTE

8.3.2.1 Show same info as ON_ROUTE

8.3.2.2 Add subtle warning text  
GPS uncertain / near route

8.3.2.3 Disable auto-follow

#### 8.3.3 OFF_ROUTE

8.3.3.1 Replace stage info with:
You are not on the route
Distance to route: X km

8.3.3.2 Hide:

- Stage distance
- POI information

8.3.3.3 Map behaviour

- Disable auto-follow
- Keep route visible

8.3.3.4 Add one action button

- “Show route” → pan/zoom to nearest route point


### 8.4 Technical integration

8.4.1 Compute `distanceToRouteM` 

- MVP: haversine distance to nearest polyline point

8.4.2 Integrate route state logic into GPS update pipeline

8.4.3 Update UI **only when route state changes**  

- Prevent flicker and unnecessary re-renders

### 8.5 Explicit non-goals (Step 8)

8.5.1 No rerouting  
8.5.2 No turn-by-turn navigation  
8.5.3 No alerts, sounds, or vibrations  
8.5.4 No user configuration


## 9. Acceptance criteria (MVP sanity check)

### 9.1 App never shows confident distances when in OFF_ROUTE state  

### 9.2 App never asks the user to configure anything  

### 9.3 UI never shows more than:

- One stage
- One POI

### 9.4 App remains useful even when there are zero POIs  

### 9.5 All functionality works without network after initial load (offline handling to be added later)
