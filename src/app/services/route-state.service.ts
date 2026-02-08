
/**
 * RouteStateService
 *
 * Responsibilities:
 * - Computes the user's route state (ON_ROUTE, NEAR_ROUTE, OFF_ROUTE) based on effective distance.
 * - Encapsulates the route state machine logic and thresholds.
 * - Provides helpers for effective distance calculations.
 */
import { Injectable } from '@angular/core';

export enum RouteState {
  ON_ROUTE = 'ON_ROUTE',
  NEAR_ROUTE = 'NEAR_ROUTE',
  OFF_ROUTE = 'OFF_ROUTE',
}

@Injectable({
  providedIn: 'root',
})
export class RouteStateService {
  private readonly ON_ROUTE_THRESHOLD = 100; // metres
  private readonly NEAR_ROUTE_THRESHOLD = 250; // metres

  /**
   * Compute effective distance and determine route state.
   * Effective distance = distance to route - GPS accuracy
   */
  getRouteState(distanceToRouteM: number, gpsAccuracyM: number): RouteState {
    const effectiveDistance = distanceToRouteM - (gpsAccuracyM ?? 0);

    if (effectiveDistance <= this.ON_ROUTE_THRESHOLD) {
      return RouteState.ON_ROUTE;
    } else if (effectiveDistance <= this.NEAR_ROUTE_THRESHOLD) {
      return RouteState.NEAR_ROUTE;
    } else {
      return RouteState.OFF_ROUTE;
    }
  }

  /**
   * Compute the effective distance
   */
  private computeEffectiveDistance(distanceToRouteM: number, gpsAccuracyM: number): number {
    return distanceToRouteM - gpsAccuracyM;
  }
}
