import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MapComponent } from './map-component';
import { LocationService } from '../services/location-service';

describe('MapComponent', () => {
  let component: MapComponent;
  let fixture: ComponentFixture<MapComponent>;

  let mockLocationService: any;

  beforeEach(async () => {
    mockLocationService = {
      startGpsWatch: jasmine.createSpy('startGpsWatch'),
      clearWatch: jasmine.createSpy('clearWatch'),
      setMiddleOfMapAsOverride: jasmine.createSpy('setMiddleOfMapAsOverride'),
      overrideCoords: undefined,
      updateGpsCallback: () => {},
      overrideEnabled: true
    };

    await TestBed.configureTestingModule({
      imports: [MapComponent],
      providers: [
        { provide: LocationService, useValue: mockLocationService }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(MapComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should show map', () => {
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.map-container')).toBeTruthy();
  });

  it('should show pan-to button when GPS is active', () => {
    // Simulate GPS available
    component.closestDistance.set(10); // Simulate user is near trail
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.pan-button')).toBeTruthy();
  });

  it('should hide pan-to button when GPS is inactive', () => {
    // Simulate GPS unavailable
    component.closestDistance.set(undefined); // No location data
    fixture.detectChanges();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.pan-button')).toBeFalsy();
  });
});

