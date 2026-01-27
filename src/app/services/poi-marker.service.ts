/**
 * PoiMarkerService
 *
 * Responsibilities:
 * - Manages the lifecycle of POI markers on the map (create, update, remove).
 * - Applies POI visibility/filtering rules for map display.
 * - Shields the rest of the app from direct Leaflet marker management.
 */
import { Injectable, inject } from '@angular/core';
import * as L from 'leaflet';
import { PoI } from '../models/trail-model';
import { TrailDataService } from '../services/trail-data-service';
import { TrailModel } from '../models/trail-model'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PoiMarkerService {
  private readonly trailDataService = inject(TrailDataService);
  private poiMarkers = new Map<string, L.Marker>();
  private readonly MAX_POI_DISTANCE = 2000; // 2 km in metres
  private readonly showAllPoIs = false //!environment.production; // Debug flag
  private readonly trailModel = new TrailModel();

  /**
   * Update POI markers based on current user position and route state.
   * Creates/destroys markers as they enter/exit visibility scope.
   */
  updatePoiMarkers(
    map: L.Map, // TODO the PoiMarkerService should not know about Leaflet map directly
    closestPoint: number,
    currentStageId: string | undefined
  ): void {
    const distancesToEnd = this.trailDataService.getDistancesToEnd();
    for (const poi of this.trailDataService.getPois()) {
      if (!poi.stage_id || !poi.idx) continue;

      const shouldBeVisible = this.shouldShowPoiMarker(
        poi,
        closestPoint,
        distancesToEnd,
        currentStageId
      );

      const markerExists = this.poiMarkers.has(poi.id);

      if (shouldBeVisible && !markerExists) {
        // Create marker
        this.createPoiMarker(poi, map);
      } else if (!shouldBeVisible && markerExists) {
        // Remove marker
        this.removePoiMarker(poi.id, map);
      }
    }
  }

  /**
   * Clean up all POI markers (e.g., when component is destroyed)
   */
  clearAllMarkers(map: L.Map): void {
    for (const [id, marker] of this.poiMarkers.entries()) {
      map.removeLayer(marker);
      this.poiMarkers.delete(id);
    }
  }

  private createPoiMarker(poi: PoI, map: L.Map): void {
    const marker = L.marker([poi.lat, poi.lon], {
      title: poi.name,
    }).addTo(map);
    marker.bindPopup(`<b>${poi.name}</b><br>Type: ${poi.type}`);
    this.poiMarkers.set(poi.id, marker);
  }

  private removePoiMarker(poiId: string, map: L.Map): void {
    const marker = this.poiMarkers.get(poiId);
    if (marker) {
      map.removeLayer(marker);
      this.poiMarkers.delete(poiId);
    }
  }

  private shouldShowPoiMarker(
    poi: PoI,
    closestPoint: number,
    distancesToEnd: number[],
    currentStageId: string | undefined
  ): boolean {
    // Debug mode: show all
    if (this.showAllPoIs) {
      return true;
    }

    // // POI must be ahead of us
    // if (poi.idx! <= closestPoint) {
    //   return false;
    // }

    // // Always show bailout type
    // if (poi.type === 'bailout') {
    //   return true;
    // }

    // Otherwise: same stage AND within distance
    if (poi.stage_id === currentStageId) {
      const distanceAlongTrail = distancesToEnd[closestPoint] - distancesToEnd[poi.idx!];
      return Math.abs(distanceAlongTrail) <= this.MAX_POI_DISTANCE;
    }
    return false;
  }

  /**
   * Returns the next PoI ahead of the user on the current stage, and the distance to it.
   * Returns undefined if no PoI is found.
   */
  getDistanceToNearestPoi(
      currentStageId: string | undefined,
      closestPoint: number,
      showAllPoIs: boolean=false): { poi: PoI|undefined, distance: number|undefined } {
    const pois = this.trailModel.getPois();
    const distancesToEnd = this.trailDataService.getDistancesToEnd();

    const MAX_POI_DISTANCE = this.MAX_POI_DISTANCE;
    for (const poi of pois) {
      if (!poi.stage_id || !poi.idx) continue;
      // Filter: same stage
      if (poi.stage_id !== currentStageId) continue;
      // Filter: POI ahead of us
      if (poi.idx <= closestPoint) continue;
      // Compute distance along trail to POI
      const distanceAlongTrail = distancesToEnd[closestPoint] - distancesToEnd[poi.idx];
      // Filter: not too far (unless debug mode or bailout type)
      if (!showAllPoIs && poi.type !== 'bailout' && distanceAlongTrail > MAX_POI_DISTANCE) {
        continue;
      }
      return { poi, distance: distanceAlongTrail };
    }
    return {poi: undefined, distance: undefined};
  }
}
