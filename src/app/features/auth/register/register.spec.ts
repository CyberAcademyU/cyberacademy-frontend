import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { RegisterComponent } from './register';
import { AuthService } from '../../../core/services/auth';
import { EMPTY } from 'rxjs';
import { vi } from 'vitest';

describe('Register', () => {
  let component: RegisterComponent;
  let fixture: ComponentFixture<RegisterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterComponent],
      providers: [provideRouter([]), provideHttpClient()],
    }).compileComponents();

    fixture = TestBed.createComponent(RegisterComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('requires confirmation before sending the registration', () => {
    const register = vi.spyOn(TestBed.inject(AuthService), 'register').mockReturnValue(EMPTY);
    component.registerForm.setValue({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com' });
    component.onSubmit();
    expect(component.confirming()).toBe(true);
    expect(register).not.toHaveBeenCalled();
    component.confirmRegistration();
    expect(register).toHaveBeenCalledWith({ firstName: 'Ana', lastName: 'Pérez', email: 'ana@example.com' });
  });
});
