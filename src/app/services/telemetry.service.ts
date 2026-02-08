import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TelemetryService {
  logPageView(page: string) {
    if ((window as any).plausible) {
      (window as any).plausible('pageview', { props: { page } });
    }
  }

  logRouteChange(to: string) {
    if ((window as any).plausible) {
      (window as any).plausible('route_state_change', { props: { to } });
    }
  }

  logFollowMeClicked() {
    if ((window as any).plausible) {
      (window as any).plausible('follow_me_clicked');
    }
  }
}
