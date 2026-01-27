# DATA_SCHEMAS — Read-only assets (MVP)

This document defines the **authoritative** JSON structures used by the MVP.
No runtime persistence is required; everything is loaded from `assets/`.

---

## 1) route.json

### Purpose
Defines the route polyline points. Optionally includes precomputed cumulative distance.

### File structure
```json
{
  "route_id": "kodo-nakahechi-classic-v1",
  "name": "Kumano Kodo — Nakahechi (Classic)",
  "points": [
    { "lat": 33.000000, "lon": 135.000000, "cum_m": 0 },
    { "lat": 33.000100, "lon": 135.000120, "cum_m": 17.2 }
  ]
}
