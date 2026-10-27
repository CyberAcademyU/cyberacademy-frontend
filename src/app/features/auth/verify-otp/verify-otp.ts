import { Component, OnInit, signal, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

@Component({
  selector: 'app-verify-otp',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './verify-otp.html',
  styleUrl: './verify-otp.css'
})
export class VerifyOtpComponent implements OnInit, OnDestroy {
  email = signal<string>('');
  digits: string[] = ['', '', '', '', '', ''];
  isLoading = signal(false);
  isResending = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);
  cooldownSeconds = signal(60);
  private timer: ReturnType<typeof setInterval> | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.email.set(params['email'] || '');
      if (!this.email()) {
        this.errorMessage.set('No se especificó un correo para verificar.');
      }
    });

    this.startCooldown();
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
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
    const val = input.value.replace(/\D/g, '');
    this.digits[index] = val ? val.slice(-1) : '';
    input.value = this.digits[index];

    if (this.digits[index] && index < 5) {
      const nextInput = input.parentElement?.children[index + 1] as HTMLInputElement;
      if (nextInput) nextInput.focus();
    }
  }

  onKeyDown(event: KeyboardEvent, index: number): void {
    const input = event.target as HTMLInputElement;
    if (event.key === 'Backspace' && !this.digits[index] && index > 0) {
      const prevInput = input.parentElement?.children[index - 1] as HTMLInputElement;
      if (prevInput) {
        prevInput.focus();
        this.digits[index - 1] = '';
      }
    }
  }

  onPaste(event: ClipboardEvent): void {
    event.preventDefault();
    const pasted = event.clipboardData?.getData('text') || '';
    const cleanNumbers = pasted.replace(/\D/g, '').slice(0, 6);
    cleanNumbers.split('').forEach((char, i) => {
      if (i < 6) this.digits[i] = char;
    });
  }

  getOtpCode(): string {
    return this.digits.join('');
  }

  verifyCode(): void {
    const otpCode = this.getOtpCode();
    if (otpCode.length !== 6 || !this.email()) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.verifyOtp({ email: this.email(), otpCode }).subscribe({
      next: () => {
        this.isLoading.set(false);
        this.successMessage.set('¡Correo verificado con éxito! Redirigiendo al login...');
        setTimeout(() => {
          this.router.navigate(['/auth/login'], { queryParams: { verified: 'true', email: this.email() } });
        }, 1500);
      },
      error: (err) => {
        this.isLoading.set(false);
        this.errorMessage.set(err.error?.message || 'Código OTP inválido o expirado.');
      }
    });
  }

  resendCode(): void {
    if (this.cooldownSeconds() > 0 || !this.email()) return;

    this.isResending.set(true);
    this.errorMessage.set(null);

    this.authService.resendOtp(this.email()).subscribe({
      next: () => {
        this.isResending.set(false);
        this.successMessage.set('Nuevo código enviado a tu bandeja de entrada.');
        this.startCooldown();
        setTimeout(() => this.successMessage.set(null), 4000);
      },
      error: (err) => {
        this.isResending.set(false);
        this.errorMessage.set(err.error?.message || 'Error al reenviar el código.');
      }
    });
  }
}