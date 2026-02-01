import { Injectable } from '@angular/core';
import { FeatureCollection, LineString, MultiLineString } from 'geojson';
import { Trail, PoI, Stage, TrailModel } from '../models/trail-model';

@Injectable({
  providedIn: 'root',
})
export class TrailDataService {
  private distancesToEndCache: number[] | null = null;
  private trailModel = new TrailModel();

  computeDistanceToEndOfStage(closestPoint: number, currentStage: Stage | undefined) : number | undefined {
    if (!currentStage) return undefined
    const distancesToEnd = this.getDistancesToEnd();
    return  distancesToEnd[closestPoint] - distancesToEnd[currentStage.end_idx];
  }

  getCurrentStage(closestPoint: number) : Stage | undefined {
    const trail = this.getTrail();
    for (const stage of trail.stages) {
      if (closestPoint >= stage.start_idx && closestPoint <= stage.end_idx) {
        return stage;
      }
    }
    return undefined;
  }

  distanceToEnd(coords: GeolocationCoordinates) {
    const closestPointData = this.findClosestPointOnTrail(coords.latitude, coords.longitude);
    const distancesToEnd = this.getDistancesToEnd();
    const distanceToEndOfTrail = distancesToEnd[closestPointData.idx];
    return distanceToEndOfTrail;
  }

  // distance between two lat/lon points in metres
  computeDistance(lat1: number, lon1: number, lat2: number, lng2: number): number {
    // Haversine formula
    const R = 6371e3; // metres
    const φ1 = lat1 * Math.PI/180; // φ, λ in radians
    const φ2 = lat2 * Math.PI/180;
    const Δφ = (lat2-lat1) * Math.PI/180;
    const Δλ = (lng2-lon1) * Math.PI/180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    const d = R * c; // in metres
    return d;
  }

  getTracksData(): FeatureCollection /*GeoJsonObject*/  {
    return this.trailModel.getTracksData();
  }

  getTrail(): Trail {
    return this.trailModel.getStages()
  }

  pois?: PoI[]

  getPois(): PoI[] {
    if(!this.pois){
      this.pois = this.trailModel.getPois()
      console.log("Loaded ", this.pois);
    }
    if(this.pois.length >0 && !this.pois[0].idx){
      console.log("Converting OSM POIs to Trail POIs with indices");
      this.pois = this.pois.map(poi => this.convertOsmPoiToPoi(poi));
    }
    console.log("Returning POIs: ", this.pois || this.pois[0]);
    return this.pois!
  }

  private convertOsmPoiToPoi(poi: PoI): PoI {
    const point = this.findClosestPointOnTrail(poi.lat, poi.lon);
    const stage_id = findStageForPoint(point.idx, this.getTrail())
    console.log(point)
    poi.idx = point.idx;
    poi.stage_id = stage_id;
    poi.id = poi.id || `${poi.type}-${poi.lat}-${poi.lon}`;
    return poi;
  }

  computeDistanceToEndFromPointIndex(pointIdx: number): number {
    const distancesToEnd = this.getDistancesToEnd();
    if (pointIdx < 0 || pointIdx >= distancesToEnd.length) {
      console.error("computeDistanceToEndFromPointIndex: pointIdx out of range ", pointIdx);
      return 0;
    }
    return distancesToEnd[pointIdx];
  }

  /**
   * Get cumulative distances from each polyline point to the trail end.
   * distancesToEnd[i] = distance from point i to the end of the trail (in metres)
   * Computed once on first access and cached.
   */
  getDistancesToEnd(): number[] {
    if (this.distancesToEndCache !== null) {
      return this.distancesToEndCache;
    }

    const polyline = this.getPolyLine();

    // Compute cumulative distances from each point to the end
    const distances = new Array(polyline.length).fill(0);

    // Start from the end and work backwards
    for (let i = polyline.length - 2; i >= 0; i--) {
      const distance = this.computeDistance(
        polyline[i][1],
        polyline[i][0],
        polyline[i + 1][1],
        polyline[i + 1][0]
      );
      distances[i] = distances[i + 1] + distance;
    }

    this.distancesToEndCache = distances;
    return distances;
  }

  /**
   * Find the closest point on the trail to the given coordinates.
   * Returns the index and distance to that point.
   */
  findClosestPointOnTrail(lat: number, lon: number): { idx: number; distance: number } {
    const polyline = this.getPolyLine();
    if (!polyline || polyline.length === 0) {
      return { idx: 0, distance: 0 };
    }
    let closestIdx = 0;
    let closestDistance = Infinity;

    for (let i = 0; i < polyline.length; i++) {
      // if( i % 1 === 0){continue;} // Skip some points for performance
      const distance = this.computeDistance(
        lat,
        lon,
        polyline[i][1],
        polyline[i][0]
      );
      if (distance < closestDistance) {
        closestIdx = i;
        closestDistance = distance;
      }
    }

    return { idx: closestIdx, distance: closestDistance };
  }

  getPolyLine() : [number, number][] {
    const tracksData = this.getTracksData();
    if (!tracksData.features || tracksData.features.length === 0) {
      return [];
    }
    const feature = tracksData.features[0];
      var polyline :[number, number][] = [];
    if (feature.geometry.type == 'LineString') {
      polyline = (feature.geometry as LineString).coordinates as [number, number][];
    }else if (feature.geometry.type == 'MultiLineString') {
      polyline = (feature.geometry as MultiLineString).coordinates[0] as [number, number][];
    }else{
      return []
    }
    return polyline
  }
}
function findStageForPoint(idx: number, arg1: Trail): string | undefined {
  for (const stage of arg1.stages) {
    if (idx >= stage.start_idx && idx <= stage.end_idx) {
      return stage.id;
    }
  }
  return undefined;
}

