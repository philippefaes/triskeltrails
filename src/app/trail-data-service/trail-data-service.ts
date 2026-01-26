import { Injectable } from '@angular/core';
import { FeatureCollection } from 'geojson';
import tracksData from '../../assets/tracks.json';

export interface Trail {
  route_id: string,
  stages: Stage[]
}
export interface Stage {
  id: string,
  name: string,
  start_idx: number,
  end_idx: number,
  end_label: string,
}

export interface PoI {
  id: string,
  type: string,
  name: string,
  lat: number,
  lon: number,
  stage_id: string,
  idx?: number,
}
@Injectable({
  providedIn: 'root',
})
export class TrailDataService {
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
    return tracksData as FeatureCollection;
  }

  getTrail(): Trail {
      return{
        "route_id": "kodo-nakahechi-classic-v1",
        "stages": [
          {
            "id": "S01",
            "name": "Takijiri → Takahara",
            "start_idx": 0,
            "end_idx": 12000,
            "end_label": "Takahara"
          },
          {
            "id": "S02",
            "name": "Takahara → Chikatsuyu",
            "start_idx": 12001,
            "end_idx": 24909,
            "end_label": "Chikatsuyu"
          }
        ]
      }
  }

  getPois(): PoI[] {
    return [
      {
        "id": "water-01",
        "type": "water",
        "name": "Water point",
        "lat": 33.79508617900561,
        "lon": 135.5304551124573,
        "stage_id": "S01",
        "idx": 7154
      },
      {
        "id": "bus-01",
        "type": "bailout",
        "name": "Bus stop",
        "lat": 33.81434258967535,
        "lon": 135.6057929992676,
        "stage_id": "S02",
        "idx": 20124
      }
    ]
  }
}
