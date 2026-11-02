import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { ProfileService } from '../../core/services/profile';
import { passwordMatchValidator } from '../../shared/validators/password-match.validator';

/**
 * Cambio de contraseña. El backend invalida todas las sesiones al cambiarla,
 * así que al terminar se cierra la sesión local y se vuelve al login.
 */
@Component({
  selector: 'app-password-form',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule],
  template: `
    @if (done()) {
      <div class="ca-alert ca-alert--secure" role="status">
        Contraseña actualizada. Cerramos tus sesiones abiertas; inicia sesión con la nueva contraseña.
      </div>
      <button type="button" class="ca-btn ca-btn--primary" (click)="goToLogin()">Iniciar sesión</button>
    } @else {
      <form class="form" [formGroup]="form" (ngSubmit)="submit()">
        <!-- Ayuda a los gestores de contraseñas a asociar la nueva clave con la cuenta -->
        <input type="email" autocomplete="username" [value]="email()" class="ca-sr-only" tabindex="-1" aria-hidden="true" readonly />

        <div class="ca-field">
          <label for="pw-current">Contraseña actual</label>
          <input id="pw-current" class="ca-input" type="password" formControlName="currentPassword"
                 autocomplete="current-password" maxlength="128" />
        </div>
        <div class="ca-field">
          <label for="pw-new">Nueva contraseña</label>
          <input id="pw-new" class="ca-input" type="password" formControlName="newPassword"
                 autocomplete="new-password" maxlength="128" aria-describedby="pw-new-hint" />
          @if (form.controls.newPassword.invalid && form.controls.newPassword.touched) {
            <span class="ca-field-error">Usa entre 8 y 128 caracteres.</span>
          } @else {
            <span id="pw-new-hint" class="ca-field-hint">Mínimo 8 caracteres. Una frase larga es más segura que una palabra corta.</span>
          }
        </div>
        <div class="ca-field">
          <label for="pw-confirm">Repite la nueva contraseña</label>
          <input id="pw-confirm" class="ca-input" type="password" formControlName="confirmPassword"
                 autocomplete="new-password" maxlength="128" />
          @if (form.errors?.['passwordMismatch'] && form.controls.confirmPassword.touched) {
            <span class="ca-field-error">Las contraseñas no coinciden.</span>
          }
        </div>

        @if (error(); as message) {
          <div class="ca-alert ca-alert--threat" role="alert">{{ message }}</div>
        }

        <button type="submit" class="ca-btn" [disabled]="sending()">
          {{ sending() ? 'Actualizando…' : 'Cambiar contraseña' }}
        </button>
      </form>
    }
  `,
  styles: `
    :host { display: grid; gap: var(--ca-space-4); justify-items: start; }
    .form { display: grid; gap: var(--ca-space-4); width: 100%; }
    .form > .ca-btn { justify-self: start; }
  `
})
export class PasswordFormComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  protected email = signal(this.auth.currentUserSignal()?.email ?? '');
  protected sending = signal(false);
  protected error = signal<string | null>(null);
  protected done = signal(false);

  protected form = this.fb.nonNullable.group(
    {
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required, Validators.minLength(8), Validators.maxLength(128)]],
      confirmPassword: ['', [Validators.required]]
    },
    { validators: passwordMatchValidator('newPassword', 'confirmPassword') }
  );

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const { currentPassword, newPassword } = this.form.getRawValue();
    this.sending.set(true);
    this.error.set(null);

    this.profileService.changePassword({ currentPassword, newPassword }).subscribe({
      next: () => {
        this.sending.set(false);
        this.form.reset();
        this.done.set(true);
        // El token actual ya está revocado en el servidor: no tiene sentido llamar a /logout
        this.auth.clearSession();
      },
      error: err => {
        this.sending.set(false);
        this.error.set(err?.status === 0
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
          : err?.error?.message || 'No se pudo cambiar la contraseña.');
      }
    });
  }

  goToLogin(): void {
    void this.router.navigate(['/auth/login']);
  }
}
