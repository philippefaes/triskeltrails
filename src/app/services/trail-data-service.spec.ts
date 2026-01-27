import { TestBed } from '@angular/core/testing';

import { TrailDataService } from './trail-data-service';

describe('TrailDataService', () => {
  let service: TrailDataService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TrailDataService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
