import { Component, signal, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { passwordMatchValidator } from '../../../shared/validators/password-match.validator';
import { AuthShellComponent } from '../../../shared/ui/auth-shell';
import { IconComponent } from '../../../shared/ui/icon';
import { RevealPasswordDirective } from '../../../shared/ui/reveal-password';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [ReactiveFormsModule, AuthShellComponent, IconComponent, RevealPasswordDirective],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent implements OnDestroy {
  currentMode = signal<'login' | 'register' | 'verify-otp'>('login');
  isLoading = signal(false);
  loginError = signal<string | null>(null);
  registerError = signal<string | null>(null);
  otpError = signal<string | null>(null);
  verifiedSuccess = signal(false);
  passwordChanged = signal(false);

  pendingEmail = signal<string>('');
  otpDigits = ['', '', '', '', '', ''];
  cooldownSeconds = signal(60);
  private timer: ReturnType<typeof setInterval> | null = null;
  private passwordChangedTimer: ReturnType<typeof setTimeout> | null = null;

  loginForm: FormGroup;
  registerForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.passwordChanged.set(this.router.getCurrentNavigation()?.extras.state?.['passwordChanged'] === true);
    if (this.passwordChanged()) {
      this.passwordChangedTimer = setTimeout(() => this.passwordChanged.set(false), 10_000);
    }
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]]
    });

    this.registerForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, {
      validators: passwordMatchValidator('password', 'confirmPassword')
    });
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
    if (this.passwordChangedTimer) clearTimeout(this.passwordChangedTimer);
  }

  setMode(mode: 'login' | 'register' | 'verify-otp'): void {
    this.currentMode.set(mode);
    this.loginError.set(null);
    this.registerError.set(null);
    this.otpError.set(null);
  }
onRegisterSubmit(): void {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      const passwordMismatch = this.registerForm.errors?.['passwordMismatch'];
      if (passwordMismatch) {
        this.registerError.set('Las contraseñas no coinciden.');
      }
      return;
    }

    const { firstName, lastName, email, password } = this.registerForm.value;

    this.isLoading.set(true);
    this.registerError.set(null);

    this.authService.register({ firstName, lastName, email, password }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.pendingEmail.set(email);
        this.otpDigits = ['', '', '', '', '', ''];
        this.startCooldown();
        this.setMode('verify-otp');
      },
      error: (err) => {
        this.isLoading.set(false);
        // Traducir error de red a español
        if (err.status === 0) {
          this.registerError.set('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
        } else {
          this.registerError.set(err.error?.message || 'Error al procesar el registro.');
        }
      }
    });
  }

  onLoginSubmit(): void {
    if (this.loginForm.invalid) {
      this.loginForm.markAllAsTouched();
      return;
    }
    this.isLoading.set(true);
    this.loginError.set(null);

    const { email, password } = this.loginForm.value;
    this.authService.login({ email, password }).subscribe({
      next: (response) => {
        this.isLoading.set(false);
        const role = response.data?.user.role;
        if (role === 'ADMIN') {
          this.router.navigate(['/dashboard/admin']);
        } else {
          this.router.navigate(['/dashboard/student']);
        }
      },
      error: (err) => {
        this.isLoading.set(false);
        if (err.status === 0) {
          this.loginError.set('No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.');
        } else if (err.status === 403 && err.error?.message?.includes('verif')) {
          this.pendingEmail.set(email);
          this.setMode('verify-otp');
        } else {
          this.loginError.set(err.error?.message || 'Correo o contraseña incorrectos.');
        }
      }
    });
  }
  startCooldown(): void {
    this.cooldownSeconds.set(60);
    if (this.timer) clearInterval(this.timer);
    const intervalId = setInterval(() => {
      if (this.cooldownSeconds() > 0) {
        this.cooldownSeconds.update(v => v - 1);
      } else {
        clearInterval(intervalId);
      }
    }, 1000);
    this.timer = intervalId;
  }

  onDigitInput(event: Event, index: number): void {
    const input = event.target as HTMLInputElement;
    const val = input.value.replace(/\D/g, '').slice(-1);
    this.otpDigits[index] = val;
    input.value = val;

    if (val && index < 5) {
      const nextInput = input.parentElement?.querySelectorAll('input')[index + 1];
      if (nextInput) nextInput.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !this.otpDigits[index] && index > 0) {
      const prevInput = input.parentElement?.querySelectorAll('input')[index - 1];
      if (prevInput) {
        prevInput.focus();
        this.otpDigits[index - 1] = '';
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    const digits = (event.clipboardData?.getData('text') ?? '').replace(/\D/g, '').slice(0, 6);
    if (!digits) return;
    event.preventDefault();
    const inputs = (event.currentTarget as HTMLElement).querySelectorAll('input');
    digits.split('').forEach((char, i) => {
      this.otpDigits[i] = char;
      inputs[i].value = char;
    });
    inputs[Math.min(digits.length, 5)]?.focus();
  }

  getOtpCode(): string {
    return this.otpDigits.join('');
  }

  onVerifyOtpSubmit(): void {
    const otpCode = this.getOtpCode();
    if (otpCode.length !== 6 || !this.pendingEmail()) return;

    this.isLoading.set(true);
    this.otpError.set(null);

    this.authService.verifyOtp({ email: this.pendingEmail(), otpCode }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.loginForm.patchValue({ email: this.pendingEmail() });
        this.verifiedSuccess.set(true);
        // Vuelve suavemente a login dentro del mismo cuadro
        this.setMode('login');
      },
      error: (err) => {
        this.isLoading.set(false);
        this.otpError.set(err.error?.message || 'Código OTP inválido o expirado.');
      }
    });
  }

  resendCode(): void {
    if (this.cooldownSeconds() > 0 || !this.pendingEmail()) return;
    this.authService.resendOtp(this.pendingEmail()).subscribe({
      next: () => this.startCooldown()
    });
  }
}
