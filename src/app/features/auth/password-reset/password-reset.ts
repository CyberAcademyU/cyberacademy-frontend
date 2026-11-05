import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { rateLimitMessage } from '../../../core/services/rate-limit-message';
import { AuthShellComponent } from '../../../shared/ui/auth-shell';
import { passwordMatchValidator } from '../../../shared/validators/password-match.validator';

@Component({
  selector: 'app-password-reset',
  imports: [ReactiveFormsModule, RouterLink, AuthShellComponent],
  styleUrl: '../login/login.css',
  template: `
    <ca-auth-shell>
      <header class="head"><h2>Recuperar contraseña</h2>
        <p>{{ requested() ? 'Introduce el código y tu nueva contraseña.' : 'Te enviaremos un código si tu cuenta existe.' }}</p>
      </header>
      @if (notice()) { <div class="ca-alert ca-alert--secure" role="status">{{ notice() }}</div> }
      @if (error()) { <div class="ca-alert ca-alert--threat" role="alert">{{ error() }}</div> }
      @if (!requested()) {
        <form class="form" [formGroup]="requestForm" (ngSubmit)="requestCode()">
          <div class="ca-field"><label for="reset-email">Correo</label>
            <input id="reset-email" class="ca-input" type="email" autocomplete="email" formControlName="email" />
          </div>
          <button class="ca-btn ca-btn--primary ca-btn--block" type="submit" [disabled]="requestForm.invalid || sending()">{{ sending() ? 'Enviando…' : 'Enviar código' }}</button>
        </form>
      } @else {
        <form class="form" [formGroup]="confirmForm" (ngSubmit)="confirm()">
          <div class="ca-field"><label for="reset-code">Código de 6 dígitos</label>
            <input id="reset-code" class="ca-input" inputmode="numeric" autocomplete="one-time-code" maxlength="6" formControlName="code" />
          </div>
          <div class="ca-field"><label for="reset-password">Nueva contraseña</label>
            <input id="reset-password" class="ca-input" type="password" autocomplete="new-password" maxlength="128" formControlName="newPassword" />
            <span class="ca-field-hint">Entre 8 y 128 caracteres.</span>
          </div>
          <div class="ca-field"><label for="reset-confirm">Repite la contraseña</label>
            <input id="reset-confirm" class="ca-input" type="password" autocomplete="new-password" maxlength="128" formControlName="confirmPassword" />
            @if (confirmForm.hasError('passwordMismatch') && confirmForm.controls.confirmPassword.touched) {
              <span class="ca-field-error">Las contraseñas no coinciden.</span>
            }
          </div>
          <button class="ca-btn ca-btn--primary ca-btn--block" type="submit" [disabled]="confirmForm.invalid || sending()">{{ sending() ? 'Actualizando…' : 'Cambiar contraseña' }}</button>
          <button class="ca-link" type="button" (click)="startOver()">Solicitar otro código</button>
        </form>
      }
      <p class="switch"><a routerLink="/auth/login" class="ca-link">Volver al inicio de sesión</a></p>
    </ca-auth-shell>
  `
})
export class PasswordResetComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  readonly requested = signal(false);
  readonly sending = signal(false);
  readonly notice = signal<string | null>(null);
  readonly error = signal<string | null>(null);
  readonly requestForm = this.fb.nonNullable.group({ email: ['', [Validators.required, Validators.email, Validators.maxLength(255)]] });
  readonly confirmForm = this.fb.nonNullable.group({
    code: ['', [Validators.required, Validators.pattern(/^[0-9]{6}$/)]],
    newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
    confirmPassword: ['', Validators.required]
  }, { validators: passwordMatchValidator('newPassword', 'confirmPassword') });

  requestCode(): void {
    if (this.requestForm.invalid || this.sending()) return;
    this.sending.set(true);
    this.error.set(null);
    this.auth.requestPasswordReset(this.requestForm.getRawValue().email).subscribe({
      next: () => {
        this.sending.set(false);
        this.requested.set(true);
        this.notice.set('Si la cuenta existe, recibirás un código de recuperación.');
      },
      error: err => { this.sending.set(false); this.error.set(rateLimitMessage(err) ?? 'No se pudo solicitar el código. Intenta nuevamente.'); }
    });
  }

  confirm(): void {
    if (this.confirmForm.invalid || this.sending()) return;
    this.sending.set(true);
    this.error.set(null);
    const { code, newPassword } = this.confirmForm.getRawValue();
    this.auth.confirmPasswordReset(this.requestForm.getRawValue().email, code, newPassword).subscribe({
      next: () => {
        this.sending.set(false);
        this.confirmForm.reset();
        void this.router.navigate(['/auth/login'], { state: { passwordChanged: true }, replaceUrl: true });
      },
      error: err => { this.sending.set(false); this.error.set(rateLimitMessage(err) ?? (err.status === 0 ? 'No se pudo conectar con el servidor.' : err.error?.message || 'No se pudo actualizar la contraseña.')); }
    });
  }

  startOver(): void {
    this.requested.set(false);
    this.notice.set(null);
    this.error.set(null);
    this.confirmForm.reset();
  }
}
