import { Component, signal, inject } from '@angular/core';
import { RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { TelemetryService } from './services/telemetry.service';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('triskeltrails');
  private readonly router = inject(Router);
  private readonly telemetry = inject(TelemetryService);

  constructor() {
    this.router.events.subscribe(event => {
      if (event instanceof NavigationEnd) {
        this.telemetry.logRouteChange(event.urlAfterRedirects);
      }
    });
  }
}
