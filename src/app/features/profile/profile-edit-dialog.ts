import { ChangeDetectionStrategy, Component, OnInit, inject, input, output, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Profile } from '../../core/models/profile.model';
import { ProfileService } from '../../core/services/profile';
import { AVATARS, AVATAR_IDS, AvatarComponent } from '../../shared/ui/avatar';
import { IconComponent } from '../../shared/ui/icon';

const BIO_MAX = 280;

/** Formulario de edición del perfil. Las reglas replican las del backend (UpdateProfileRequest). */
@Component({
  selector: 'app-profile-edit-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [ReactiveFormsModule, AvatarComponent, IconComponent],
  template: `
    <div class="ca-backdrop" (click)="cancel.emit()">
      <form class="ca-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-title"
            [formGroup]="form" (ngSubmit)="save()" (click)="$event.stopPropagation()">
        <div class="ca-dialog-head">
          <h2 id="edit-title">Editar perfil</h2>
          <button type="button" class="ca-icon-btn" (click)="cancel.emit()" aria-label="Cerrar sin guardar">
            <ca-icon name="close" />
          </button>
        </div>

        <div class="ca-dialog-body">
          <fieldset class="avatars">
            <legend class="ca-field-label">Avatar</legend>
            @for (id of avatarIds; track id) {
              <label class="avatar-option" [title]="avatarName(id)">
                <input type="radio" formControlName="avatar" [value]="id" class="ca-sr-only" />
                <ca-avatar [avatar]="id" [size]="52" />
                <span class="ca-sr-only">{{ avatarName(id) }}</span>
              </label>
            }
          </fieldset>

          <div class="row">
            <div class="ca-field">
              <label for="pf-first">Nombre</label>
              <input id="pf-first" class="ca-input" formControlName="firstName" autocomplete="given-name" maxlength="100" />
              @if (form.controls.firstName.invalid && form.controls.firstName.touched) {
                <span class="ca-field-error">Escribe entre 2 y 100 caracteres.</span>
              }
            </div>
            <div class="ca-field">
              <label for="pf-last">Apellido</label>
              <input id="pf-last" class="ca-input" formControlName="lastName" autocomplete="family-name" maxlength="100" />
              @if (form.controls.lastName.invalid && form.controls.lastName.touched) {
                <span class="ca-field-error">Escribe entre 2 y 100 caracteres.</span>
              }
            </div>
          </div>

          <div class="ca-field">
            <label for="pf-alias">Alias público</label>
            <input id="pf-alias" class="ca-input" formControlName="displayName" autocomplete="nickname"
                   maxlength="30" aria-describedby="pf-alias-hint" spellcheck="false" />
            @if (form.controls.displayName.invalid && form.controls.displayName.touched) {
              <span class="ca-field-error">De 3 a 30 caracteres: letras sin tilde, números, punto, guion o guion bajo.</span>
            } @else {
              <span id="pf-alias-hint" class="ca-field-hint">Es el nombre que verán los demás en la clasificación. Si lo dejas vacío se usa tu nombre y la inicial del apellido.</span>
            }
          </div>

          <div class="ca-field">
            <label for="pf-country">País</label>
            <input id="pf-country" class="ca-input" formControlName="country" autocomplete="country-name" maxlength="60" />
            @if (form.controls.country.invalid && form.controls.country.touched) {
              <span class="ca-field-error">Solo letras y espacios, hasta 60 caracteres.</span>
            }
          </div>

          <div class="ca-field">
            <label for="pf-bio">Biografía</label>
            <textarea id="pf-bio" class="ca-input" formControlName="bio" [attr.maxlength]="bioMax"
                      aria-describedby="pf-bio-count" rows="3"></textarea>
            <span id="pf-bio-count" class="ca-field-hint ca-num">{{ form.controls.bio.value.length }} de {{ bioMax }} caracteres</span>
          </div>

          <label class="ca-switch">
            <span>
              <strong>Aparecer en la clasificación</strong>
              <span class="ca-field-hint">Si lo desactivas, nadie verá tu alias ni tu XP y no tendrás puesto.</span>
            </span>
            <input type="checkbox" role="switch" formControlName="showInLeaderboard" />
          </label>

          @if (error(); as message) {
            <div class="ca-alert ca-alert--threat" role="alert">{{ message }}</div>
          }
        </div>

        <div class="ca-dialog-foot">
          <button type="button" class="ca-btn" (click)="cancel.emit()">Cancelar</button>
          <button type="submit" class="ca-btn ca-btn--primary" [disabled]="saving()">
            {{ saving() ? 'Guardando…' : 'Guardar cambios' }}
          </button>
        </div>
      </form>
    </div>
  `,
  styles: `
    .avatars {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(60px, 1fr));
      gap: var(--ca-space-2);
      margin: 0;
      padding: 0;
      border: 0;
    }
    .avatars legend { float: left; width: 100%; margin-bottom: var(--ca-space-2); }
    .avatar-option {
      display: grid;
      place-items: center;
      padding: 4px;
      border: 1px solid transparent;
      border-radius: var(--ca-radius-sm);
      cursor: pointer;
      transition: border-color var(--ca-fast), background-color var(--ca-fast);
    }
    .avatar-option:hover { border-color: var(--ca-line-strong); }
    .avatar-option:has(input:checked) { border-color: var(--ca-signal); background: var(--ca-signal-soft); }
    .avatar-option:has(input:focus-visible) { box-shadow: var(--ca-focus); }
    .row { display: grid; grid-template-columns: 1fr 1fr; gap: var(--ca-space-4); }
    .ca-switch > span { display: grid; gap: 2px; }
    @media (max-width: 480px) { .row { grid-template-columns: 1fr; } }
  `
})
export class ProfileEditDialogComponent implements OnInit {
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);

  profile = input.required<Profile>();
  saved = output<void>();
  cancel = output<void>();

  protected readonly avatarIds = AVATAR_IDS;
  protected readonly bioMax = BIO_MAX;
  protected saving = signal(false);
  protected error = signal<string | null>(null);

  protected form = this.fb.nonNullable.group({
    avatar: [''],
    firstName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    lastName: ['', [Validators.required, Validators.minLength(2), Validators.maxLength(100)]],
    displayName: ['', [Validators.pattern(/^[A-Za-z0-9_.-]{3,30}$/)]],
    country: ['', [Validators.pattern(/^[\p{L} .'-]{0,60}$/u)]],
    bio: ['', [Validators.maxLength(BIO_MAX)]],
    showInLeaderboard: [true]
  });

  ngOnInit(): void {
    const p = this.profile();
    this.form.setValue({
      avatar: p.avatar ?? '',
      firstName: p.firstName,
      lastName: p.lastName,
      displayName: p.displayName ?? '',
      country: p.country ?? '',
      bio: p.bio ?? '',
      showInLeaderboard: p.showInLeaderboard
    });
  }

  avatarName(id: string): string {
    return AVATARS[id]?.name ?? id;
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving.set(true);
    this.error.set(null);
    const value = this.form.getRawValue();

    this.profileService.update({
      ...value,
      firstName: value.firstName.trim(),
      lastName: value.lastName.trim(),
      displayName: value.displayName.trim(),
      country: value.country.trim(),
      bio: value.bio.trim()
    }).subscribe({
      next: () => {
        this.saving.set(false);
        this.saved.emit();
      },
      error: err => {
        this.saving.set(false);
        this.error.set(err?.status === 0
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
          : err?.error?.message || 'No se pudo guardar tu perfil.');
      }
    });
  }
}
