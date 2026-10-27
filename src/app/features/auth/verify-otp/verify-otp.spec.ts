import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { VerifyOtpComponent } from './verify-otp';

describe('VerifyOtp', () => {
  let component: VerifyOtpComponent;
  let fixture: ComponentFixture<VerifyOtpComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [VerifyOtpComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(VerifyOtpComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
