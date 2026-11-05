import { Component, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { AuthShellComponent } from '../../../shared/ui/auth-shell';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  templateUrl: './register.html',
  styleUrl: '../login/login.css'
})
export class RegisterComponent {
  registerForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal<string | null>(null);
  confirming = signal(false);

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]]
    });
  }

  get f() {
    return this.registerForm.controls;
  }

  onSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.confirming.set(true);
    this.errorMessage.set(null);
  }

  confirmRegistration(): void {
    if (!this.confirming() || this.registerForm.invalid || this.isLoading()) return;
    this.isLoading.set(true);
    this.errorMessage.set(null);

    const { firstName, lastName, email } = this.registerForm.getRawValue();

    this.authService.register({ firstName, lastName, email }).subscribe({
      next: () => {
        this.isLoading.set(false);
        // Redirige automáticamente a la pantalla de verificación OTP con el email
        this.router.navigate(['/auth/verify-otp'], { queryParams: { email } });
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Error al procesar el registro.');
      }
    });
  }
}
