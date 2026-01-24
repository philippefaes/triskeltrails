import { Injectable } from '@angular/core';
import tracksData from '../../assets/tracks.json';

@Injectable({
  providedIn: 'root',
})
export class TrailDataService {
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

  getTracksData(): any /*GeoJsonObject | GeoJsonObject[] */{
    return tracksData;
  }

    getTrail(): any {
      return{
        "route_id": "kodo-nakahechi-classic-v1",
        "stages": [
          {
            "id": "S01",
            "name": "Takijiri → Takahara",
            "start_idx": 0,
            "end_idx": 7200,
            "end_label": "Takahara"
          },
          {
            "id": "S02",
            "name": "Takahara → Chikatsuyu",
            "start_idx": 7201,
            "end_idx": 24910,
            "end_label": "Chikatsuyu"
          }
        ]
      }
  }
}
