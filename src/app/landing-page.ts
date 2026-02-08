import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-landing-page',
  template: `
    <div class="landing-container">
      <h1>Triskel Trails</h1>
      <p>Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque euismod, nisi vel consectetur euismod, nisl nisi consectetur nisi, euismod euismod nisi nisi euismod nisi.</p>
      <button class="cta-button" (click)="openMap()">Open Map</button>
    </div>
  `,
  styleUrl: './landing-page.scss',
})
export class LandingPage {
  constructor(private router: Router) {}

  openMap() {
    this.router.navigate(['/map']);
  }
}
