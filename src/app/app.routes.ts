import { Routes } from '@angular/router';
import { MapComponent } from './map-component/map-component';
import { LandingPage } from './landing-page-component/landing-page';

export const routes: Routes = [
  {path:"", component:LandingPage},
  {path:"map", component:MapComponent},
];
