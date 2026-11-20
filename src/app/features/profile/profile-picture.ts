import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';
import { AvatarComponent, AVATARS, AVATAR_IDS } from '../../shared/ui/avatar';
import { ProfileService } from '../../core/services/profile';
import { ApiResponse } from '../../core/models/user.model';
import { Profile } from '../../core/models/profile.model';

@Component({
  selector: 'app-profile-picture',
  imports: [AvatarComponent],
  template: `
    @if (profile(); as p) {
      <section class="picture" aria-label="Imagen de perfil" [attr.aria-busy]="busy()">
        <h3>Foto de perfil</h3>
        <p>JPG o PNG, máximo 2 MB. Se recorta al centro en formato cuadrado.</p>
        @if (p.role === 'STUDENT') {
          <p>Elige un avatar o sube una foto. Tu imagen se muestra en la clasificación si tu perfil es visible.</p>
        } @else {
          <p>Puedes usar una foto o dejar tu perfil sin imagen.</p>
        }
        <div class="controls">
          <button type="button" class="ca-btn" [disabled]="busy()" [attr.aria-busy]="busy()"
                  (click)="fileInput.click()">{{ busy() ? 'Guardando…' : (p.photoUrl ? 'Cambiar foto' : 'Subir foto') }}</button>
          <input #fileInput type="file" accept="image/jpeg,image/png" hidden (change)="selectFile(fileInput)" />
          @if (p.photoUrl) {
            <button type="button" class="ca-btn ca-btn--quiet" [disabled]="busy()" (click)="remove()">Quitar foto</button>
          }
        </div>
        @if (p.role === 'STUDENT') {
          <fieldset [disabled]="busy()">
            <legend>O elige un avatar</legend>
            <div class="avatars">
              @for (id of avatarIds; track id) {
                <button type="button" class="avatar-choice" [attr.aria-label]="avatarName(id)"
                        [attr.aria-pressed]="!p.photoUrl && p.avatar === id" (click)="choose(id)">
                  <ca-avatar [avatar]="id" [size]="48" />
                </button>
              }
            </div>
          </fieldset>
        }
        @if (error()) { <p class="ca-alert ca-alert--threat" role="alert">{{ error() }}</p> }
        @if (notice()) { <p role="status">{{ notice() }}</p> }
      </section>
    }
  `,
  styles: `
    .picture { display: grid; gap: var(--ca-space-3); }
    p { color: var(--ca-text-dim); font-size: var(--ca-text-sm); margin: 0; }
    .controls { display: flex; flex-wrap: wrap; gap: var(--ca-space-2); }
    fieldset { margin: 0; padding: 0; border: 0; min-width: 0; }
    legend { margin-bottom: var(--ca-space-2); font-size: var(--ca-text-sm); }
    .avatars { display: flex; flex-wrap: wrap; gap: var(--ca-space-2); }
    .avatar-choice { padding: 4px; border: 2px solid transparent; border-radius: 50%; background: transparent; cursor: pointer; }
    .avatar-choice[aria-pressed="true"] { border-color: var(--ca-signal); }
    .avatar-choice:focus-visible { outline: 2px solid var(--ca-signal); outline-offset: 2px; }
  `,
})
export class ProfilePictureComponent {
  private service = inject(ProfileService);
  private destroy = inject(DestroyRef);
  readonly profile = this.service.profile;
  readonly busy = signal(false);
  readonly busyChange = output<boolean>();
  readonly error = signal('');
  readonly notice = signal('');
  readonly avatarIds = AVATAR_IDS;
  avatarName(id: string) { return AVATARS[id].name; }

  selectFile(input: HTMLInputElement) {
    const file = input.files?.[0];
    input.value = '';
    if (!file || this.busy()) return;
    if (!['image/jpeg', 'image/png'].includes(file.type) || file.size > 2 * 1024 * 1024 || file.size === 0) {
      this.error.set('Elige una imagen JPG o PNG de hasta 2 MB.');
      return;
    }
    this.save(this.service.uploadPhoto(file), 'Foto actualizada.');
  }
  remove() { if (!this.busy()) this.save(this.service.removePhoto(), 'Foto eliminada.'); }
  choose(id: string) { if (!this.busy()) this.save(this.service.chooseAvatar(id), 'Avatar actualizado.'); }
  private save(request: Observable<ApiResponse<Profile>>, message: string) {
    this.busy.set(true);
    this.busyChange.emit(true);
    this.error.set('');
    this.notice.set('');
    request.pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.busy.set(false); this.busyChange.emit(false); this.notice.set(message); },
      error: err => {
        this.busy.set(false);
        this.busyChange.emit(false);
        this.error.set(err.status === 413 ? 'La foto supera el límite de 2 MB.' : err.error?.message || 'No se pudo actualizar la imagen. Intenta de nuevo.');
      },
    });
  }
}
