import { AfterViewInit, Component, inject, OnInit, Pipe, signal } from '@angular/core';
import * as L from 'leaflet';
import { TrailDataService, Stage, Trail, PoI } from '../trail-data-service/trail-data-service';
import { LocationService } from '../location-service/location-service';
import { DistancePipe } from '../pipes';

import { LineString, Polygon } from 'geojson';
import { environment } from 'src/environments/environment';

const endOfStageIcon = L.divIcon({
  className: 'stage-endpoint',
  html: '<div style="width:15px;height:15px;border-radius:50%;background:green;"></div>',
  iconSize: [12, 12],
  iconAnchor: [6, 6],
});
@Component({
  selector: 'app-map-component',
  imports: [DistancePipe],
  templateUrl: './map-component.html',
  styleUrl: './map-component.scss',
})

export class MapComponent implements OnInit, AfterViewInit{
  watchId: number | null = null;
  userMarker: L.Marker|null = null;
  private readonly trailDataService = inject(TrailDataService);
  private readonly locationService = inject(LocationService);
  readonly isProduction = environment.production;
  readonly showAllPoIs = false ;//!environment.production; // Debug flag: show all POIs in dev mode
  private poiMarkers = new Map<string, L.Marker>(); // Track POI markers by ID
  //calculated values
  closestDistance = signal<number | undefined>(undefined); // in metres
  currentStage = signal<Stage | undefined>(undefined);
  distanceToEndOfStage = signal<number | undefined>(undefined); // in metres
  distanceToEndOfTrail = signal<number | undefined>(undefined); // in metres
  nextPoi = signal<PoI | undefined>(undefined);
  distanceToNextPoi = signal<number | undefined>(undefined);

  followMe = false;

  constructor() { }

  ngOnInit(): void {
    this.startGpsWatch()
  }

  ngOnDestroy(): void {
    this.stopGpsWatch();
  }

  formatDistance(distanceKm: number | undefined): string {
    if (distanceKm == null) {
      return 'N/A';
    }
    return distanceKm.toFixed(2) + ' km';
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private map?: L.Map;
  private userLatLng: L.LatLng | null = null;

  private initMap(): void {
    //
    // Tiles
    //

    // const tilesUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    // const tilesUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    const tilesUrl = 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=697c449658504ae186b026c965c540e7'

    this.map = L.map('map', {
      // center: [ 39.8282, -98.5795 ],
      center: [33.8407298,135.7735975],
      zoom: 10
    });

    const tiles = L.tileLayer(tilesUrl, {
      maxZoom: this.isProduction ?17 : 20, // switch to 17 to save tiles
      minZoom: this.isProduction ?10 : 2,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });

    //
    // GPS trail
    //
    tiles.addTo(this.map);
    const options = {
      async: true,
      polyline_options: { color: 'red' },
    };

    const geoJsonTrack = this.trailDataService.getTracksData();
    L.geoJSON(geoJsonTrack).addTo(this.map)
    this.map.fitBounds(L.geoJSON(geoJsonTrack).getBounds());

    const coords = (geoJsonTrack.features[0].geometry as LineString).coordinates;
    const trail = this.trailDataService.getTrail();
    // start point
    const endPoint = coords[trail.stages[0].start_idx];
    const marker = L.marker([endPoint[1], endPoint[0]], {
        title: 'start',
        icon: endOfStageIcon,
      }).addTo(this.map);
    // Stage endpoints
    for (const stage of trail.stages) {
      const endPoint = coords[stage.end_idx];
      const marker = L.marker([endPoint[1], endPoint[0]], {
        title: stage.end_label,
        icon: endOfStageIcon,
      }).addTo(this.map);
      marker.bindPopup(`<b>${stage.end_label}</b>`).openPopup();
    }
    // POI markers will be managed dynamically in processLocation()

    this.map.on('dragend', () => {
        this.followMe = false;
        console.log("map moved to ",this.map!.getCenter());
        this.locationService.setMiddleOfMapAsOverride(this.map!.getCenter().lat, this.map!.getCenter().lng);

    });
  }

  public stopGpsWatch() {
    if (this.watchId != null){
      this.locationService.clearWatch(this.watchId)
    }
    this.watchId = null;
  }

  private updateUserLocation(lat: number, lng: number, accuracyM: number): void {
    const latLng: L.LatLngExpression = [lat, lng];
    this.userLatLng = L.latLng(lat, lng); // Store for pan-to-location
    if (!this.userMarker) {
      this.userMarker = L.marker(latLng,
        {icon: L.divIcon({
          className: 'user-dot',
          html: '<div style="width:15px;height:15px;border-radius:50%;background:blue;"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      }).addTo(this.map!);
    } else {
      this.userMarker.setLatLng(latLng);
    }

    // optioneel: accuracircle
    // L.circle(latLng, { radius: accuracyM }).addTo(this.map); // let op: maak dan 1 circle en update hem, anders spam je layers

  }
  public startGpsWatch() {
    console.log("Polling location...");
    this.watchId = this.locationService.startGpsWatch(
      (pos) => {
        //const coords = this.overrideCoords? this.overrideCoords : pos.coords
        const coords = pos.coords;
        this.updateUserLocation(coords.latitude, coords.longitude, coords.accuracy);
        this.processLocation(pos);
      },
      (err) => {
         console.error('GPS error:', err.code, err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 5000,
        timeout: 10000
      }
    );
  }

  /// these functions should go to a separate service
  processLocation(pos: GeolocationPosition): void {
    const coords = pos.coords;
    console.log(`Location: ${coords.latitude}, ${coords.longitude} (accuracy: ${coords.accuracy}m)`);

    // distance to trail
    const { idx: closestPoint, distance: closestDistance } = this.trailDataService.findClosestPointOnTrail(
      coords.latitude,
      coords.longitude
    );
    this.closestDistance.set(Math.round(closestDistance));
    console.log("closest point is index ", closestPoint, " at distance ", closestDistance, " meters");

    // Get pre-calculated distances from each point to trail end
    const distancesToEnd = this.trailDataService.getDistancesToEnd();

    // Compute distance to end of entire trail
    this.distanceToEndOfTrail.set(distancesToEnd[closestPoint]);

    // determine current stage
    for (const stage of this.trailDataService.getTrail().stages) {
      console.log()
      if (closestPoint >= stage.start_idx && closestPoint <= stage.end_idx){
        console.log("User is on stage: ",stage.name, " (",stage.id, ")");
        this.currentStage.set(stage);
        // Compute distance along trail to end of stage
        const distanceAlongTrail = distancesToEnd[closestPoint] - distancesToEnd[stage.end_idx];
        this.distanceToEndOfStage.set(distanceAlongTrail);
      }
    }
    // distance to nearest PoI

    this.nextPoi.set(undefined);
    const MAX_POI_DISTANCE = 2000; // 2 km in metres

    for (const poi of this.trailDataService.getPois()) {
      if (!poi.stage_id || !poi.idx) continue;

      // Filter: same stage
      if (poi.stage_id !== this.currentStage()?.id) continue;

      // Filter: POI ahead of us
      if (poi.idx <= closestPoint) continue;

      // Compute distance along trail to POI
      const distanceAlongTrail = distancesToEnd[closestPoint] - distancesToEnd[poi.idx];

      // Filter: not too far (unless debug mode or bailout type)
      if (!this.showAllPoIs && poi.type !== 'bailout' && distanceAlongTrail > MAX_POI_DISTANCE) {
        continue;
      }

      console.log("Found PoI:", poi);
      this.distanceToNextPoi.set(distanceAlongTrail);
      this.nextPoi.set(poi);

      break;
    }

    // Update POI markers visibility
    this.updatePoiMarkers(closestPoint, distancesToEnd);
  }

  private updatePoiMarkers(closestPoint: number, distancesToEnd: number[]): void {
    if (!this.map) return;

    const MAX_POI_DISTANCE = 2000; // 2 km in metres
    const currentStageId = this.currentStage()?.id;

    for (const poi of this.trailDataService.getPois()) {
      if (!poi.stage_id || !poi.idx) continue;

      // Determine if POI should be visible
      const shouldBeVisible = this.shouldShowPoiMarker(poi, closestPoint, distancesToEnd, MAX_POI_DISTANCE, currentStageId);

      const markerExists = this.poiMarkers.has(poi.id);

      if (shouldBeVisible && !markerExists) {
        // Create marker
        const marker = L.marker([poi.lat, poi.lon], {
          title: poi.name,
        }).addTo(this.map);
        marker.bindPopup(`<b>${poi.name}</b><br>Type: ${poi.type}`);
        this.poiMarkers.set(poi.id, marker);
      } else if (!shouldBeVisible && markerExists) {
        // Remove marker
        const marker = this.poiMarkers.get(poi.id)!;
        this.map.removeLayer(marker);
        this.poiMarkers.delete(poi.id);
      }
    }
  }

  private shouldShowPoiMarker(
    poi: PoI,
    closestPoint: number,
    distancesToEnd: number[],
    maxDistance: number,
    currentStageId: string | undefined
  ): boolean {
    // Debug mode: show all
    if (this.showAllPoIs) {
      return true;
    }

    // POI must be ahead of us
    if (poi.idx! <= closestPoint) {
      return false;
    }

    // Always show bailout type
    if (poi.type === 'bailout') {
      return true;
    }

    // Otherwise: same stage AND within distance
    if (poi.stage_id === currentStageId) {
      const distanceAlongTrail = distancesToEnd[closestPoint] - distancesToEnd[poi.idx!];
      return Math.abs(distanceAlongTrail) <= maxDistance;
    }

    return false;
  }

  public panToUserLocation(): void {
    if (this.map && this.userLatLng) {
      this.map.panTo(this.userLatLng);
      this.map.setZoom(15);
      this.followMe = true;
    }
  }
}
