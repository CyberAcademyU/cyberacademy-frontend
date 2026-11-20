import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ProfilePictureComponent } from './profile-picture';
import { ProfileService } from '../../core/services/profile';

describe('imagen de perfil', () => {
  const profile = signal({ role: 'STUDENT', avatar: 'op-01', photoUrl: null as string | null });
  const uploadPhoto = vi.fn();
  const chooseAvatar = vi.fn();
  const removePhoto = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    profile.set({ role: 'STUDENT', avatar: 'op-01', photoUrl: null });
    uploadPhoto.mockReturnValue(of({}));
    chooseAvatar.mockReturnValue(of({}));
    removePhoto.mockReturnValue(of({}));
    TestBed.configureTestingModule({
      imports: [ProfilePictureComponent],
      providers: [{ provide: ProfileService, useValue: { profile, uploadPhoto, chooseAvatar, removePhoto } }],
    });
  });

  it('ofrece avatares y subir foto para estudiantes', () => {
    const fixture = TestBed.createComponent(ProfilePictureComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.avatar-choice').length).toBe(8);
    expect(fixture.nativeElement.textContent).toContain('Subir foto');
    fixture.componentInstance.choose('op-03');
    expect(chooseAvatar).toHaveBeenCalledWith('op-03');
  });

  it('administrador solo puede subir o quitar foto, sin catálogo de avatares', () => {
    profile.set({ role: 'ADMIN', avatar: '', photoUrl: '/profile/photos/123' });
    const fixture = TestBed.createComponent(ProfilePictureComponent);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.avatar-choice')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Cambiar foto');
    expect(fixture.nativeElement.textContent).toContain('Quitar foto');
    fixture.componentInstance.remove();
    expect(removePhoto).toHaveBeenCalledTimes(1);
  });

  it('rechaza SVG y fotos demasiado grandes antes de enviarlas', () => {
    const fixture = TestBed.createComponent(ProfilePictureComponent);
    const component = fixture.componentInstance;
    component.selectFile({ files: [new File(['<svg/>'], 'x.svg', { type: 'image/svg+xml' })], value: '' } as unknown as HTMLInputElement);
    expect(component.error()).toContain('JPG o PNG');
    component.selectFile({ files: [new File([new Uint8Array(2097153)], 'x.png', { type: 'image/png' })], value: '' } as unknown as HTMLInputElement);
    expect(uploadPhoto).not.toHaveBeenCalled();
  });

  it('envía un archivo válido y limpia el selector para permitir repetirlo', () => {
    const fixture = TestBed.createComponent(ProfilePictureComponent);
    const file = new File(['png'], 'photo.png', { type: 'image/png' });
    const input = { files: [file], value: 'photo.png' } as unknown as HTMLInputElement;
    fixture.componentInstance.selectFile(input);
    expect(uploadPhoto).toHaveBeenCalledWith(file);
    expect(input.value).toBe('');
    expect(fixture.componentInstance.notice()).toBe('Foto actualizada.');
  });
});
