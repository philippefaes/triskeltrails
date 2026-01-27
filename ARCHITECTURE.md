# TriskelTrails Architecture Overview

## Purpose

This document describes the high-level architecture, design principles, and service boundaries for the TriskelTrails application. It is intended to guide development, onboarding, and code review, and to ensure architectural consistency as the project evolves.

---

## 1. Application Layers

- **Presentation Layer (Components)**
  - Responsible for UI rendering and user interaction.
  - Delegates all business logic and state management to services.
  - Example: `MapComponent` renders the map and UI controls, but does not contain business logic.

- **Service Layer**
  - Encapsulates business logic, state management, and data orchestration.
  - Services are single-responsibility and stateless where possible.
  - Examples: `TrailDataService`, `LocationService`, `PoiMarkerService`, `RouteStateService`.

- **Data Layer**
  - Provides static and computed data (e.g., trail geometry, POIs, stages).
  - Data is loaded from assets or computed at runtime.

---

## 2. Key Services and Responsibilities

- **TrailDataService**
  - Provides static and computed data about the trail, stages, and POIs.
  - Performs geospatial calculations (e.g., haversine, cumulative distances).

- **LocationService**
  - Manages user geolocation (GPS) tracking and updates.
  - Handles development overrides for location.

- **PoiMarkerService**
  - Manages the lifecycle of POI markers on the map (create, update, remove).
  - Applies POI visibility/filtering rules for map display.

- **RouteStateService**
  - Computes the user's route state (ON_ROUTE, NEAR_ROUTE, OFF_ROUTE) based on effective distance.
  - Encapsulates the route state machine logic and thresholds.

---

## 3. State Management

- **Signals**
  - Used for local component state and reactive updates.
  - Derived state is computed in the component or service using `computed()`.

- **Business Logic Location**
  - All business logic resides in services, not in components.
  - Components act as pure adapters between the UI and the service layer.

---

## 4. UI Principles

- **Minimal, Calm Interface**
  - Only essential information is shown to the user.
  - No lists, filtering UI, or category selection for POIs.

- **Accessibility**
  - All UI must pass AXE checks and meet WCAG AA standards.

---

## 5. Routing

- The app uses Angular standalone components and native control flow (`@if`, `@for`).
- Feature routes are lazy-loaded where applicable.

---

## 6. Environment and Feature Flags

- Environment files (`environment.ts`, `environment.prod.ts`) are used for build-time toggling of features (e.g., debug flags).

---

## 7. Deployment

- The app is deployed to Google App Engine (Node.js 22, Standard Environment).
- Static assets are served by Express in production.

---

## 8. Roadmap and Documentation

- The `ROADMAP.md` file tracks feature progress and next steps.
- This architecture file should be updated as the project evolves.

---

## 9. References

- See `.github/copilot-instructions.md` for enforced coding standards and best practices.
- See `ROADMAP.md` for feature planning and status.

---

*Last updated: 2026-01-26*
