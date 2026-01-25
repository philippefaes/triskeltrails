import {Pipe, PipeTransform} from '@angular/core';
@Pipe({
  name: 'distance',
  standalone: true,
})
export class DistancePipe implements PipeTransform {
  transform(distanceInMeters: number|undefined): string {
    if (distanceInMeters == undefined)
      return "N/A";
    else if (distanceInMeters < 1000)
      return String(Math.round(distanceInMeters)) + ' m';
    else if (distanceInMeters < 10500)
      return String((distanceInMeters / 1000).toFixed(1)) + ' km';
    else
      return String(Math.round(distanceInMeters / 1000)) + ' km';
  }
}
