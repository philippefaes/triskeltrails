import { AfterViewInit, Component, inject, OnInit, Pipe, signal } from '@angular/core';
import * as L from 'leaflet';
import { TrailDataService, Stage, Trail, PoI } from '../trail-data-service/trail-data-service';
import { LocationService } from '../location-service/location-service';
import { DistancePipe } from '../pipes';

import { LineString, Polygon } from 'geojson';

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

  //calculated values
  closestDistance = signal<number | undefined>(undefined); // in metres
  currentStage = signal<Stage | undefined>(undefined);
  distanceToEndOfStage = signal<number | undefined>(undefined); // in metres
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
      maxZoom: 20, // switch to 17 to save tiles
      minZoom: 8,
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

    //
    // POIs
    //
    const pois = this.trailDataService.getPois();
    for (const poi of pois) {
      const marker = L.marker([poi.lat, poi.lon], {
        title: poi.name,
      }).addTo(this.map);
      marker.bindPopup(`<b>${poi.name}</b><br>Type: ${poi.type}`).openPopup();
    }

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
    var closestPoint=0
    var closestDistance = 1e10
    const points = (this.trailDataService.getTracksData().features[0].geometry as LineString).coordinates
    for (let i=0; i<points.length; i++) {
      const point = points[i];
      const distance = this.trailDataService.computeDistance(
        coords.latitude, coords.longitude,
        point[1], point[0]
      );
      if (i==0 || distance < closestDistance){
        closestPoint = i;
        closestDistance = distance;
      }
    }
    this.closestDistance.set(Math.round(closestDistance));
    console.log("closest point is index ",closestPoint," at distance ",closestDistance," meters");

    // determine current stage
    for (const stage of this.trailDataService.getTrail().stages) {
      console.log()
      if (closestPoint >= stage.start_idx && closestPoint <= stage.end_idx){
        console.log("User is on stage: ",stage.name, " (",stage.id, ")");
        this.currentStage.set(stage);
        // TODO: compute distance along trail, not "as the crow flies"
        this.distanceToEndOfStage.set( this.trailDataService.computeDistance(
          coords.latitude, coords.longitude,
          points[stage.end_idx][1], points[stage.end_idx][0]
        ) );
      }
    }
    // distance to nearest PoI

    // TODO: only show PoI for current stage, and within 2 km?
    this.nextPoi.set(undefined);
    for (const poi of this.trailDataService.getPois()) {
      if (poi.stage_id == this.currentStage()?.id && poi.idx && poi.idx > closestPoint){
        console.log("Found PoI:", poi);
        // TODO: compute distance along trail, not "as the crow flies"
        this.distanceToNextPoi.set( this.trailDataService.computeDistance(coords.latitude, coords.longitude,
          poi.lat, poi.lon) );
        this.nextPoi.set(poi);

        break;
      }
    }
  }
}
