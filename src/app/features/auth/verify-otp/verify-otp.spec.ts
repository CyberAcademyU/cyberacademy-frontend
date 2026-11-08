import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { VerifyOtpComponent } from './verify-otp';
import { AuthService } from '../../../core/services/auth';
import { EMPTY } from 'rxjs';
import { vi } from 'vitest';

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

  it('requires a matching password before verifying the code', () => {
    const verify = vi.spyOn(TestBed.inject(AuthService), 'verifyOtp').mockReturnValue(EMPTY);
    component.email.set('ana@example.com');
    component.digits = ['1', '2', '3', '4', '5', '6'];
    component.passwordForm.setValue({ password: 'password123', confirmPassword: 'different' });
    component.verifyCode();
    expect(verify).not.toHaveBeenCalled();
    component.passwordForm.setValue({ password: 'password123', confirmPassword: 'password123' });
    component.verifyCode();
    expect(verify).toHaveBeenCalledWith({ email: 'ana@example.com', otpCode: '123456', password: 'password123' });
  });
});
