import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})

export class LocationService {

  overrideCoords: any | {latitude: number, longitude: number, accuracy:number} =
  {latitude: 51.21472833548849, longitude: 3.6220121383666997, accuracy: 5};

  readonly overrideEnabled = !environment.production;

  updateGpsCallback: ((pos: GeolocationPosition) => void ) = pos=>{};
  interval?: number;
  latMovement = -0.0001; // simulate movement to the south
  lonMovement = 0.00001; // simulate movement to the east

  startGpsWatch(successCallback: PositionCallback, errorCallback: (err: any) => void, parameters: { enableHighAccuracy: boolean; maximumAge: number; timeout: number; }): number | null {
    this.updateGpsCallback = successCallback
    if(!this.overrideEnabled){
      return navigator.geolocation.watchPosition(successCallback, errorCallback, parameters);
    } else {
      console.log("Using override coordinates");
      navigator.geolocation.getCurrentPosition((pos) => {
        this.overrideCoords = {
          latitude: this.overrideCoords.latitude - 0.0005,
          longitude: this.overrideCoords.longitude,
          accuracy: this.overrideCoords.accuracy};
        var dummyPos /*: GeolocationPosition*/ = {coords:this.overrideCoords, timestamp: Date.now()};
        successCallback(dummyPos as GeolocationPosition);
        this.interval = setInterval(() => {
          dummyPos = {coords:this.overrideCoords, timestamp: Date.now()};
          dummyPos.coords.latitude += this.latMovement; // Simuleer beweging naar het zuiden
          dummyPos.coords.longitude += this.lonMovement; // Simuleer beweging naar het oosten
          successCallback(dummyPos as GeolocationPosition);
        }, 500);

      }, errorCallback, parameters);
    return this.interval!;
    }
  }

  clearWatch(watchId: number) {
    if (watchId === this.interval) {
      clearInterval(this.interval);
    }else{
        navigator.geolocation.clearWatch(watchId);
    }
  }

  setOverrideCoords(lat: number, lng: number){
    if (this.overrideEnabled){
      this.overrideCoords = {latitude:lat, longitude: lng, accuracy:5};
      var dummyPos /*: GeolocationPosition*/ = {coords:this.overrideCoords, timestamp: Date.now()};
      this.updateGpsCallback(dummyPos as GeolocationPosition)
    }
  }
}
