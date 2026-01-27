import { Injectable } from '@angular/core';
import { FeatureCollection } from 'geojson';
// const trailname = 'nakahechi';
import tracksData from '../../assets/scaldea/tracks.json';
import pois from '../../assets/nakahechi/pois.json';
import stages from '../../assets/scaldea/stages.json';

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
export class TrailModel {

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

  getTracksData(): FeatureCollection {
    return tracksData as FeatureCollection;
  }

  getStages(): Trail {
    return stages as Trail;
  }

  getPois(): PoI[] {
    return pois as PoI[];
  }
}
