/**
 * MapStateService
 *
 * Responsibilities:
 * - Aggregates and orchestrates all map-related state for the MapComponent.
 * - Exposes signals/observables for user location, filtered POIs, route polyline, stage endpoints, and route state.
 * - Composes business logic from TrailDataService, LocationService, RouteStateService, and others.
 * - Provides a single source of truth for the map UI, decoupling business logic from map rendering.
 */
import { Injectable, computed, signal, effect } from '@angular/core';
import { TrailDataService } from '../services/trail-data-service';
import { PoI, Stage } from '../models/trail-model';
import { LocationService } from '../services/location-service';
import { RouteStateService, RouteState } from './route-state.service';

@Injectable({
  providedIn: 'root',
})
export class MapStateService {
  // Signals for user location, POIs, route, etc.
  readonly userLocation = signal<GeolocationPosition | null>(null);
  readonly routePolyline = signal<[number, number][]>([]);
  readonly stages = signal<Stage[]>([]);
  readonly pois = signal<PoI[]>([]);
  readonly routeState = signal<RouteState | null>(null);

  constructor(
    private readonly trailData: TrailDataService,
    private readonly location: LocationService,
    private readonly routeStateService: RouteStateService
  ) {
    // Initialize signals from services
    this.routePolyline.set(
      (this.trailData.getTracksData().features[0].geometry as any).coordinates as [number, number][]
    );
    this.stages.set(this.trailData.getTrail().stages);
    this.pois.set(this.trailData.getPois());

    // Example: listen to location updates and compute route state
    effect(() => {
      // You would wire this up to a real observable in a full implementation
      // For now, just a placeholder for how to reactively update state
      const pos = this.userLocation();
      if (pos) {
        const { idx, distance } = this.trailData.findClosestPointOnTrail(pos.coords.latitude, pos.coords.longitude);
        const effectiveDistance = this.routeStateService.computeEffectiveDistance(distance, pos.coords.accuracy);
        this.routeState.set(this.routeStateService.getRouteState(distance, pos.coords.accuracy));
      }
    });
  }
}
