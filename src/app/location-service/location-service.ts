import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})



export class LocationService {

  overrideCoords /* : GeolocationCoordinates */
    = {latitude:33.7963722, longitude: 135.5223151, accuracy: 5};
    // = {latitude:33.819017855854305, longitude: 135.6248474121094, accuracy: 5};
  overrideEnabled = true;

  startGpsWatch(arg0: (pos: any) => void, arg1: (err: any) => void, arg2: { enableHighAccuracy: boolean; maximumAge: number; timeout: number; }): number | null {
    return navigator.geolocation.watchPosition(
      (pos) => {
        if (this.overrideEnabled){
          var dummyPos /*: GeolocationPosition*/ = {coords:this.overrideCoords, timestamp: pos.timestamp};
          arg0(dummyPos);
        } else{
          arg0(pos);

        }
        },
      (err) => {arg1(err);},
      arg2
    );
  }

  clearWatch(watchId: number) {
      navigator.geolocation.clearWatch(watchId);
  }

}
