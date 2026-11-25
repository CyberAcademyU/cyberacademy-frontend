import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { of, throwError } from 'rxjs';
import { vi } from 'vitest';
import { ExploreComponent } from './explore';
import { CatalogService } from '../../core/services/catalog';
import { AuthService } from '../../core/services/auth';

describe('descubrir qué se aprende en CyberAcademy', () => {
  const catalog = { getPublicModules: vi.fn() };
  beforeEach(() => {
    catalog.getPublicModules.mockReturnValue(of({ data: [{
      code: 'CA-01', title: 'Bandeja de entrada', description: 'Aprende a reconocer correos y mensajes falsos.',
      cover: 'inbox', orderIndex: 1, passingScore: 70,
      topics: ['Phishing y smishing', 'Remitentes falsos y enlaces engañosos'],
    }] }));
    TestBed.configureTestingModule({
      imports: [ExploreComponent],
      providers: [provideRouter([]), { provide: CatalogService, useValue: catalog },
        { provide: AuthService, useValue: {
          currentUserSignal: signal(null), isAuthenticated: () => false, isAdmin: () => false,
        } }],
    });
  });
  function render() {
    const fixture = TestBed.createComponent(ExploreComponent);
    fixture.detectChanges();
    return fixture;
  }
  it('explica los conocimientos y deja consultar temas sin cuenta', () => {
    const fixture = render();
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Descubre lo que aprenderás');
    expect(fixture.nativeElement.textContent).toContain('proteger tus cuentas y cuidar tu información personal');
    expect(fixture.nativeElement.textContent).toContain('tres lecciones cortas');
    expect(fixture.nativeElement.querySelector('main').textContent).toContain('Phishing y smishing');
    expect(fixture.nativeElement.querySelector('main a').getAttribute('href')).toBe('/auth/login');
  });
  it('conserva la recuperación ante errores del catálogo', () => {
    catalog.getPublicModules.mockReturnValue(throwError(() => new Error('sin conexión')));
    const fixture = render();
    expect(fixture.nativeElement.querySelector('[role="alert"]').textContent).toContain('Catálogo no disponible');
    expect(fixture.nativeElement.querySelector('main button').textContent).toContain('Reintentar');
  });
  it('conserva el estado de catálogo vacío', () => {
    catalog.getPublicModules.mockReturnValue(of({ data: [] }));
    const fixture = render();
    expect(fixture.nativeElement.textContent).toContain('Aún no hay módulos publicados');
    expect(fixture.nativeElement.querySelector('h1').textContent).toBe('Descubre lo que aprenderás');
  });
});
