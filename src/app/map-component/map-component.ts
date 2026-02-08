import { AfterViewInit, Component, effect, inject, OnInit, Pipe, Signal, signal } from '@angular/core';
import { TelemetryService } from '../services/telemetry.service';
import { RouteStateService, RouteState } from '../services/route-state.service';
import * as L from 'leaflet';
import { Stage, PoI } from '../models/trail-model';
import { LocationService } from '../services/location-service';
import { DistancePipe } from '../pipes';

import { LineString, Polygon } from 'geojson';
import { environment } from 'src/environments/environment';
import { PoiMarkerService } from '../services/poi-marker.service';
import { TrailModel } from '../models/trail-model';
import { TrailDataService } from '../services/trail-data-service';

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
export class MapComponent implements OnInit, AfterViewInit {
  watchId: number | null = null;
  locationMarker: L.Marker|null = null;
  private readonly locationService = inject(LocationService);
  private readonly poiMarkerService = inject(PoiMarkerService);
  private readonly trailModel = new TrailModel();
  private readonly trailDataService = inject(TrailDataService);
  private readonly routeStateService = inject(RouteStateService);
  private readonly telemetry = inject(TelemetryService);
  readonly isProduction = environment.production;

  private poiMarkers = new Map<string, L.Marker>(); // Track POI markers by ID

  //calculated values
  closestDistance = signal<number | undefined>(undefined); // in metres
  currentStage = signal<Stage | undefined>(undefined);
  distanceToEndOfStage = signal<number | undefined>(undefined); // in metres
  distanceToEndOfTrail = signal<number | undefined>(undefined); // in metres
  nextPoi = signal<PoI | undefined>(undefined);
  distanceToNextPoi = signal<number | undefined>(undefined);
  routeState = signal<RouteState | undefined>(undefined);

  /**
   * followMe: true = AUTO (map auto-pans to user)
   * followMe: false = MANUAL (user controls map)
   */
  followMe = signal<boolean>(false);
  userPos = signal<GeolocationPosition | null >(null);

  constructor() {
    effect(() => {
      console.log("Route state changed to ", this.routeState());
      if (this.routeState() === 'NEAR_ROUTE' || this.routeState() === 'OFF_ROUTE') {
        this.followMe.set(false);
      }else if (this.routeState() === 'ON_ROUTE') {
        // do not force followMe true, just allow it
        // user should click pan-to button to re-enable
      }
    });
    effect(() => {
      console.log("FollowMe changed to:", this.followMe());
    });
    effect(() => {
      const pos = this.userPos();
      if (pos) {
        this.processLocation(pos);
        this.updateLocationMarker();
      }
      if (this.followMe()){
        this.doPan(this.userPos());
      }
    });
  }

  ngOnInit(): void {
    this.startGpsWatch()
  }

  ngOnDestroy(): void {
    this.stopGpsWatch();
  }

  ngAfterViewInit(): void {
    this.initMap();
  }

  private map?: L.Map;

  private initMap(): void {
    //
    // Tiles
    //

    // const tilesUrl = 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
    // const tilesUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png'
    const tilesUrl = 'https://tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey=697c449658504ae186b026c965c540e7'

    this.map = L.map('map', {
      center: [33.8407298,135.7735975],
      zoom: 10,
      zoomControl: false
    });

    //
    // Attribution
    //
    const tiles = L.tileLayer(tilesUrl, {
      maxZoom: this.isProduction ?17 : 20, // switch to 17 to save tiles
      minZoom: this.isProduction ?7 : 2,

      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    tiles.addTo(this.map);
    const attributionControl = this.map?.attributionControl?.setPrefix(false);

    //
    // GPS trail
    //
    const options = {
      async: true,
      polyline_options: { color: 'red' },
    };
    const geoJsonTrack = this.trailModel.getTracksData();
    L.geoJSON(geoJsonTrack).addTo(this.map)
    this.map.fitBounds(L.geoJSON(geoJsonTrack).getBounds());
    const coords = this.trailDataService.getPolyLine()
    const trail = this.trailModel.getStages();

    //
    // Stage start and end points
    //
    const endPoint = coords[trail.stages[0].start_idx];
    this.createStageEndMarker('Start', endPoint);
    // Stage endpoints
    for (const stage of trail.stages) {
      const endPoint = coords[stage.end_idx];
      this.createStageEndMarker(stage.end_label, endPoint);
    }

    //
    // Event handlers
    //
    this.map.on('click', (event: L.LeafletMouseEvent) => {
      console.log("Map clicked at ", event.latlng);
      if (this.locationService.overrideEnabled){
        // for debugging purposes, allow clicking on the map to set the user location (when override is enabled)
        this.locationService.setOverrideCoords(event.latlng.lat, event.latlng.lng);
      }
    });

    this.map.on('dragend', () => {
      // User interaction disables follow mode (MANUAL)
      this.followMe.set(false);
    });

    this.map.on('zoomend', () => {
      // User interaction disables follow mode (MANUAL)
      this.followMe.set(false);
    });

    // Scale control
    L.control.scale({
      position: 'bottomleft',
      maxWidth: 100,
      metric: true,
      imperial: false
    }).addTo(this.map!);
  }

  private createStageEndMarker(name: string, coord: number[]): void {
    const marker = L.marker([coord[1], coord[0]], {
        title: name,
        icon: endOfStageIcon,
      }).addTo(this.map!);
    marker.bindPopup(`<b>${name}</b>`);
  }
  public stopGpsWatch() {
    if (this.watchId != null){
      this.locationService.clearWatch(this.watchId)
    }
    this.watchId = null;
  }

  private updateLocationMarker(): void {
    const userPos = this.userPos();
    if (!userPos) return;
    const latLng :L.LatLngExpression = new L.LatLng(userPos.coords.latitude, userPos.coords.longitude)  ;
    if (!latLng) return;

    if (!this.locationMarker) {
      this.locationMarker = L.marker(latLng,
        {icon: L.divIcon({
          className: 'user-dot',
          html: '<div style="width:15px;height:15px;border-radius:50%;background:blue;"></div>',
          iconSize: [12, 12],
          iconAnchor: [6, 6],
        }),
      }).addTo(this.map!);
    } else {
      this.locationMarker.setLatLng(latLng);
    }

    // optioneel: accuracy circle
    // L.circle(latLng, { radius: accuracyM }).addTo(this.map); // let op: maak dan 1 circle en update hem, anders spam je layers
  }

  public startGpsWatch() {
    this.watchId = this.locationService.startGpsWatch(
      (pos: GeolocationPosition) => {
        this.userPos.set(pos);
      },
      (err: any) => {
        console.error('GPS error:', err.code, err.message);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 500, // can be 5000
        timeout: 10000
      }
    );
  }

  /// these functions should go to a separate service
  processLocation(pos: GeolocationPosition): void {
    if(!this.map) return;
    const currentCoords = pos.coords;

    // distance to trail
    const { idx: closestPoint, distance: closestDistance } =
      this.trailDataService.findClosestPointOnTrail(currentCoords.latitude, currentCoords.longitude);
    this.closestDistance.set(Math.round(closestDistance));

    // Compute route state using RouteStateService
    const routeState = this.routeStateService.getRouteState(closestDistance, currentCoords.accuracy);
    this.routeState.set(routeState);

    this.distanceToEndOfTrail.set(this.trailDataService.distanceToEnd(currentCoords));

    // determine current stage
    const currentStage = this.trailDataService.getCurrentStage(closestPoint);
    this.currentStage.set(currentStage);

    const distanceToEndOfStage = this.trailDataService.computeDistanceToEndOfStage(closestPoint,currentStage);
    this.distanceToEndOfStage.set(distanceToEndOfStage);

    // distance to nearest PoI
    const result = this.poiMarkerService.getDistanceToNearestPoi(
      currentStage?.id,
      closestPoint);
    this.distanceToNextPoi.set(result.distance);
    this.nextPoi.set(result.poi);

    // Update POI markers visibility
    this.poiMarkerService.updatePoiMarkers(
      this.map,
      closestPoint,
      this.currentStage()?.id,
      closestDistance,
      currentCoords,
    );
  }



  /**
   * Called by "Follow me" button. One-time center on user, and set follow mode.
   * Also logs custom telemetry event.
   */
  public panToUserLocation(): void {
    this.doPan(this.userPos());
    if (this.routeState() === 'ON_ROUTE') {
      this.followMe.set(true);
    } else {
      this.followMe.set(false);
    }
    this.telemetry.logFollowMeClicked();
  }

  private doPan(pos: GeolocationPosition|null): void {
    if(this.map){
      if(pos){
        const latLng = new L.LatLng(pos.coords.latitude, pos.coords.longitude)
        this.map.panTo(latLng,
           {animate: false, duration: 1, easeLinearity: 0.5, noMoveStart: true}
        );
        this.map.setZoom(15);
      }
    }
  }
}

