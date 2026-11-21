import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../../core/services/auth';
import { AuthShellComponent } from '../../../shared/ui/auth-shell';

const confirmedName = (control: AbstractControl) => {
  const value = String(control.value ?? '').trim();
  return value.length >= 2 && value.length <= 100 && !/[\u0000-\u001f\u007f]/.test(value) ? null : { name: true };
};

@Component({
  selector: 'app-google-details',
  imports: [ReactiveFormsModule, AuthShellComponent],
  template: `
    <ca-auth-shell>
      <header class="head">
        <h2>Completa tu registro con Google</h2>
        <p>Escribe tu nombre y apellido como quieres que aparezcan en CyberAcademy.</p>
      </header>
      <form class="form" [formGroup]="form" (ngSubmit)="submit()" novalidate>
        <div class="ca-field">
          <label for="google-first-name">Nombres</label>
          <input id="google-first-name" class="ca-input" formControlName="firstName" autocomplete="given-name"
                 maxlength="100" aria-describedby="google-first-hint" />
          <span id="google-first-hint" class="ca-field-hint">De 2 a 100 caracteres.</span>
        </div>
        <div class="ca-field">
          <label for="google-last-name">Apellidos</label>
          <input id="google-last-name" class="ca-input" formControlName="lastName" autocomplete="family-name"
                 maxlength="100" aria-describedby="google-last-hint" />
          <span id="google-last-hint" class="ca-field-hint">De 2 a 100 caracteres.</span>
        </div>
        <p class="ca-field-hint">Google ya verificó tu correo. No necesitas otro código de CyberAcademy.</p>
        @if (error()) { <p class="ca-alert ca-alert--threat" role="alert">{{ error() }}</p> }
        <button type="submit" class="ca-btn ca-btn--primary ca-btn--block"
                [disabled]="form.invalid || busy()" [attr.aria-busy]="busy()">
          {{ busy() ? 'Creando cuenta…' : 'Crear mi cuenta' }}
        </button>
        <button type="button" class="ca-btn ca-btn--quiet" [disabled]="busy()" (click)="cancel()">Volver al registro</button>
      </form>
    </ca-auth-shell>
  `,
  styles: `
    .head { display: grid; gap: var(--ca-space-2); margin-bottom: var(--ca-space-5); }
    .head h2 { font-size: var(--ca-text-xl); }
    .head p { color: var(--ca-text-dim); font-size: var(--ca-text-sm); }
    .form { display: grid; gap: var(--ca-space-4); }
  `,
})
export class GoogleDetailsComponent implements OnInit {
  private auth = inject(AuthService);
  private router = inject(Router);
  private destroy = inject(DestroyRef);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly form = inject(FormBuilder).nonNullable.group({
    firstName: ['', [Validators.required, confirmedName]],
    lastName: ['', [Validators.required, confirmedName]],
  });

  ngOnInit() {
    this.destroy.onDestroy(() => this.auth.cancelGoogleRegistration());
    if (!this.auth.hasPendingGoogleRegistration()) void this.router.navigate(['/auth/register'], { replaceUrl: true });
  }
  submit() {
    if (this.busy() || this.form.invalid) { this.form.markAllAsTouched(); return; }
    if (!this.auth.hasPendingGoogleRegistration()) { this.cancel(); return; }
    this.busy.set(true);
    this.error.set('');
    const names = this.form.getRawValue();
    this.auth.completeGoogleRegistration(names.firstName.trim(), names.lastName.trim())
      .pipe(takeUntilDestroyed(this.destroy)).subscribe({
        next: response => {
          void this.router.navigate([response.data?.user.role === 'ADMIN' ? '/dashboard/admin' : '/dashboard/student']);
        },
        error: err => {
          this.busy.set(false);
          if (err.status === 401) {
            this.auth.cancelGoogleRegistration();
            this.error.set('La verificación de Google caducó. Vuelve al registro y selecciona tu cuenta otra vez.');
          } else this.error.set(err.error?.message || 'No se pudo crear la cuenta. Intenta de nuevo.');
        },
      });
  }
  cancel() {
    this.auth.cancelGoogleRegistration();
    void this.router.navigate(['/auth/register']);
  }
}
