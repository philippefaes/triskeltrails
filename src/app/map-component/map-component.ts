import { AfterViewInit, Component, inject, OnInit, Pipe, signal } from '@angular/core';
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

export class MapComponent implements OnInit, AfterViewInit{
  watchId: number | null = null;
  userMarker: L.Marker|null = null;
  private readonly locationService = inject(LocationService);
  private readonly poiMarkerService = inject(PoiMarkerService);
  private readonly trailModel = new TrailModel();
  private readonly trailDataService = inject(TrailDataService);
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
      center: [33.8407298,135.7735975],
      zoom: 10
    });

    const tiles = L.tileLayer(tilesUrl, {
      maxZoom: this.isProduction ?17 : 20, // switch to 17 to save tiles
      minZoom: this.isProduction ?10 : 2,
      attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    });
    tiles.addTo(this.map);

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
    const coords = (geoJsonTrack.features[0].geometry as LineString).coordinates;
    const trail = this.trailModel.getTrail();

    // Start point
    const endPoint = coords[trail.stages[0].start_idx];
    this.createStageEndMarker('Start', endPoint);
    // Stage endpoints
    for (const stage of trail.stages) {
      const endPoint = coords[stage.end_idx];
      this.createStageEndMarker(stage.end_label, endPoint);
    }

    this.map.on('dragend', () => {
        this.followMe = false;
        console.log("map moved to ",this.map!.getCenter());
        this.locationService.setMiddleOfMapAsOverride(this.map!.getCenter().lat, this.map!.getCenter().lng);

    });
  }

  private createStageEndMarker(name: string, coord: number[]): void {
    const marker = L.marker([coord[1], coord[0]], {
        title: name,
        icon: endOfStageIcon,
      }).addTo(this.map!);
      marker.bindPopup(`<b>${name}</b>`).openPopup();
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
      (pos:any) => {
        //const coords = this.overrideCoords? this.overrideCoords : pos.coords
        const coords = pos.coords;
        this.updateUserLocation(coords.latitude, coords.longitude, coords.accuracy);
        this.processLocation(pos);
      },
      (err:any) => {
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
    if(!this.map) return;
    const currentCoords = pos.coords;
    console.log(`Location: ${currentCoords.latitude}, ${currentCoords.longitude} (accuracy: ${currentCoords.accuracy}m)`);

    // distance to trail
    const { idx: closestPoint, distance: closestDistance } =
      this.trailDataService.findClosestPointOnTrail(currentCoords.latitude, currentCoords.longitude);
    this.closestDistance.set(Math.round(closestDistance));
    console.log("closest point is index ", closestPoint, " at distance ", closestDistance, " meters");

    this.distanceToEndOfTrail.set(this.trailDataService.distanceToEnd(currentCoords));

    // determine current stage
    const currentStage = this.trailDataService.getCurrentStage(closestPoint);
    this.currentStage.set(currentStage);

    const distanceToEndOfStage = this.trailDataService.computeDistanceToEndOfStage(closestPoint,currentStage);
    this.distanceToEndOfStage.set(distanceToEndOfStage);

    // distance to nearest PoI
    const result = this.poiMarkerService.getDistanceToNearestPoi(
      currentStage?.id,
      closestPoint,
      this.showAllPoIs);
    this.distanceToNextPoi.set(result.distance);
    this.nextPoi.set(result.poi);

    // Update POI markers visibility
    this.poiMarkerService.updatePoiMarkers(
      this.map,
      closestPoint,
      this.currentStage()?.id
    );
  }



  public panToUserLocation(): void {
    if (this.map && this.userLatLng) {
      this.map.panTo(this.userLatLng);
      this.map.setZoom(15);
      this.followMe = true;
    }
  }
}
