import { Component, OnDestroy, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { rateLimitMessage } from '../../../core/services/rate-limit-message';
import { AuthShellComponent } from '../../../shared/ui/auth-shell';
import { IconComponent } from '../../../shared/ui/icon';
import { RevealPasswordDirective } from '../../../shared/ui/reveal-password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, AuthShellComponent, IconComponent, RevealPasswordDirective, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnDestroy {
  private fb = inject(FormBuilder);
  isLoading = signal(false);
  loginError = signal<string | null>(null);
  verifiedSuccess = signal(false);
  passwordChanged = signal(false);
  private passwordChangedTimer: ReturnType<typeof setTimeout> | null = null;
  loginForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', Validators.required]
  });

  constructor(private authService: AuthService,
              private router: Router, private route: ActivatedRoute) {
    this.passwordChanged.set(this.router.getCurrentNavigation()?.extras.state?.['passwordChanged'] === true);
    if (this.passwordChanged()) this.passwordChangedTimer = setTimeout(() => this.passwordChanged.set(false), 10_000);
    this.verifiedSuccess.set(this.route.snapshot.queryParamMap.get('verified') === 'true');
    this.loginForm.patchValue({ email: this.route.snapshot.queryParamMap.get('email') ?? '' });
  }

  ngOnDestroy(): void {
    if (this.passwordChangedTimer) clearTimeout(this.passwordChangedTimer);
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.loginError.set(null);
    const { email, password } = this.loginForm.getRawValue();
    this.authService.login({ email: email!, password: password! }).subscribe({
      next: response => {
        this.isLoading.set(false);
        void this.router.navigate([response.data?.user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/student']);
      },
      error: err => {
        this.isLoading.set(false);
        this.loginError.set(rateLimitMessage(err) ?? (err.status === 0
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
          : err.error?.message || 'Correo o contraseña incorrectos.'));
      }
    });
  }
}
