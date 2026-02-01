import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class LocationService {

  overrideCoords: any | {latitude: number, longitude: number, accuracy:number} = undefined;

  readonly overrideEnabled = !environment.production;

  updateGpsCallback: ((pos: GeolocationPosition) => void ) = pos=>{};

  startGpsWatch(arg0: (pos: any) => void, arg1: (err: any) => void, arg2: { enableHighAccuracy: boolean; maximumAge: number; timeout: number; }): number | null {
    this.updateGpsCallback = arg0
    return navigator.geolocation.watchPosition(
      (pos) => {
        if (this.overrideEnabled){
          console.log("Using override coordinates");
          var dummyPos /*: GeolocationPosition*/ = {coords:this.overrideCoords, timestamp: pos.timestamp};
          arg0(dummyPos);
        } else{
          console.log("Using live GPS coordinates");
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

  setMiddleOfMapAsOverride(lat: number, lng: number){
    if (this.overrideEnabled){
      this.overrideCoords = {latitude:lat, longitude: lng, accuracy:5};
      var dummyPos /*: GeolocationPosition*/ = {coords:this.overrideCoords, timestamp: Date.now()};
      this.updateGpsCallback(dummyPos as GeolocationPosition)
    }
  }
}
