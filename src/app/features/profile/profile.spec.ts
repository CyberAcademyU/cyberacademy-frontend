import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { By } from '@angular/platform-browser';
import { ProfileComponent } from './profile';
import { ProfileService } from '../../core/services/profile';
import { Profile } from '../../core/models/profile.model';
import { AuthService } from '../../core/services/auth';
import { GoogleButtonComponent } from '../auth/google-button';

describe('perfil del administrador dentro del panel', () => {
  const profile = signal<Profile | null>(null);

  beforeEach(() => {
    profile.set({
      id: 'admin', role: 'ADMIN', email: 'admin@gmail.com', googleLinked: false,
      firstName: 'Miguel', lastName: 'Talavera', publicName: 'Miguel',
      createdAt: '2026-01-01T00:00:00Z', badges: [], activity: [],
      displayName: null, bio: null, country: null, avatar: null,
      showInLeaderboard: false, xp: 0, rank: null, totalRanked: 0,
      modulesCompleted: 0, modulesTotal: 0, averageScore: null,
      currentStreak: 0, longestStreak: 0,
      league: { code: 'RECLUTA', name: 'Recluta', minXp: 0, nextCode: null, nextName: null, nextMinXp: null },
    });
    TestBed.configureTestingModule({
      imports: [ProfileComponent],
      providers: [
        provideRouter([]),
        { provide: ProfileService, useValue: { profile, load: () => of({ data: profile() }) } },
        { provide: AuthService, useValue: { currentUserSignal: profile } },
      ],
    });
  });

  function render() {
    const fixture = TestBed.createComponent(ProfileComponent);
    fixture.componentRef.setInput('embedded', true);
    fixture.detectChanges();
    return fixture;
  }

  it('muestra datos y seguridad sin navegación ni estadísticas de estudiante', () => {
    const fixture = render();
    const root: HTMLElement = fixture.nativeElement;
    expect(root.textContent).toContain('admin@gmail.com');
    expect(root.textContent).toContain('Administrador');
    expect(root.textContent).toContain('Cambiar contraseña');
    expect(root.querySelector('ca-app-header')).toBeNull();
    expect(root.querySelector('.stats')).toBeNull();
    expect(root.querySelector('.checklist-card')).toBeNull();
    expect(root.querySelector('ca-google-button')).not.toBeNull();
    expect(fixture.componentInstance.checklist().length).toBe(3);
  });

  it('no ofrece vincular Google si ya está vinculado', () => {
    profile.update(p => ({ ...p!, googleLinked: true }));
    const fixture = render();
    expect(fixture.nativeElement.querySelector('ca-google-button')).toBeNull();
    expect(fixture.nativeElement.textContent).toContain('Cuenta vinculada');
  });

  it('no ofrece vincular Google para correos que no son Gmail', () => {
    profile.update(p => ({ ...p!, email: 'admin@example.com' }));
    expect(render().nativeElement.querySelector('ca-google-button')).toBeNull();
  });

  for (const role of ['ADMIN', 'STUDENT'] as const) {
    it(`actualiza Google y su check sin recargar para ${role}`, () => {
      profile.update(p => ({ ...p!, role }));
      const fixture = render();
      const button = fixture.debugElement.query(By.directive(GoogleButtonComponent)).componentInstance as GoogleButtonComponent;
      button.linkSucceeded.emit();
      fixture.detectChanges();
      expect(profile()?.googleLinked).toBe(true);
      expect(fixture.nativeElement.querySelector('.google-linked').textContent).toContain('Cuenta vinculada');
      expect(fixture.nativeElement.querySelector('.google-linked ca-icon')).not.toBeNull();
      // No desmontar el aviso de éxito hasta que terminen sus 3 segundos.
      expect(fixture.nativeElement.querySelector('ca-google-button')).not.toBeNull();
      button.linked.emit();
      fixture.detectChanges();
      expect(fixture.nativeElement.querySelector('ca-google-button')).toBeNull();
      expect(fixture.nativeElement.querySelector('.google-linked')).not.toBeNull();
    });
  }

  it('conserva el porcentaje de perfil para estudiantes', () => {
    profile.update(p => ({ ...p!, role: 'STUDENT' }));
    expect(render().nativeElement.querySelector('.checklist-card')).not.toBeNull();
  });
});
