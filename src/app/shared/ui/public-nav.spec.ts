import { TestBed } from '@angular/core/testing';
import { signal } from '@angular/core';
import { provideRouter } from '@angular/router';
import { AuthService } from '../../core/services/auth';
import { PublicNavComponent } from './public-nav';

describe('navegación pública', () => {
  const user = signal<{ role: string } | null>(null);
  beforeEach(() => {
    user.set(null);
    TestBed.configureTestingModule({
      imports: [PublicNavComponent],
      providers: [provideRouter([]), {
        provide: AuthService, useValue: {
          currentUserSignal: user, isAuthenticated: () => !!user(),
          isAdmin: () => user()?.role === 'ADMIN',
        },
      }],
    });
  });
  function render() {
    const fixture = TestBed.createComponent(PublicNavComponent);
    fixture.detectChanges();
    return fixture;
  }
  it('conserva solo registro e inicio de sesión, sin duplicar el acceso al catálogo', () => {
    const fixture = render();
    const links = [...fixture.nativeElement.querySelectorAll('.links a')] as HTMLAnchorElement[];
    expect(links.map(link => link.textContent?.trim())).toEqual([
      'Crear cuenta', 'Iniciar sesión',
    ]);
    expect(links.map(link => link.getAttribute('href'))).toEqual([
      '/auth/register', '/auth/login',
    ]);
    expect(fixture.nativeElement.querySelector('a[href="/explorar"]')).toBeNull();
    expect(links[0].classList.contains('hide-sm')).toBe(false);
    expect(links[1].classList.contains('ca-btn--primary')).toBe(true);
  });
  it('dirige al panel del estudiante autenticado sin duplicar el acceso al catálogo', () => {
    user.set({ role: 'STUDENT' });
    const fixture = render();
    expect(fixture.nativeElement.querySelector('a[href="/explorar"]')).toBeNull();
    expect(fixture.nativeElement.querySelector('.ca-btn--primary').getAttribute('href')).toBe('/dashboard/student');
    expect(fixture.nativeElement.textContent).not.toContain('Crear cuenta');
  });
  it('dirige a los administradores a su propio panel', () => {
    user.set({ role: 'ADMIN' });
    const fixture = render();
    expect(fixture.nativeElement.querySelector('.ca-btn--primary').getAttribute('href')).toBe('/dashboard/admin');
  });
});
