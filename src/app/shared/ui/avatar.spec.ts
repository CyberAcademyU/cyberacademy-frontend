import { TestBed } from '@angular/core/testing';
import { AvatarComponent } from './avatar';

describe('avatar y foto', () => {
  beforeEach(() => TestBed.configureTestingModule({ imports: [AvatarComponent] }));

  it('prioriza una foto válida y vuelve al avatar si falla su carga', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('avatar', 'op-01');
    fixture.componentRef.setInput('photoUrl', '/profile/photos/12345678-1234-1234-1234-123456789abc');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).not.toBeNull();
    fixture.nativeElement.querySelector('img').dispatchEvent(new Event('error'));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('svg')).not.toBeNull();
  });

  it('no carga imágenes externas ni datos SVG arbitrarios', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('photoUrl', 'https://example.com/track.png');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    fixture.componentRef.setInput('photoUrl', 'data:image/svg+xml,<svg/>');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });

  it('permite que el administrador no muestre foto ni iniciales', () => {
    const fixture = TestBed.createComponent(AvatarComponent);
    fixture.componentRef.setInput('empty', true);
    fixture.componentRef.setInput('name', 'Administrador');
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent.trim()).toBe('');
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
  });
});
