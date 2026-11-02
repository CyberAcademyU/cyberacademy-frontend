import { TestBed } from '@angular/core/testing';
import { TheoryMediaComponent } from './theory-media';

describe('TheoryMediaComponent', () => {
  it('muestra imágenes y un video de YouTube válido', () => {
    const fixture = TestBed.createComponent(TheoryMediaComponent);
    fixture.componentRef.setInput('title', 'Phishing');
    fixture.componentRef.setInput('imageUrl1', 'https://example.com/imagen.jpg');
    fixture.componentRef.setInput('videoUrl', 'https://youtu.be/abcdefghijk');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('img').getAttribute('alt')).toContain('Phishing');
    expect(fixture.nativeElement.querySelector('iframe').getAttribute('src')).toBe('https://www.youtube-nocookie.com/embed/abcdefghijk');
  });

  it('no incrusta dominios que solo aparentan ser YouTube ni enlaces inseguros', () => {
    const fixture = TestBed.createComponent(TheoryMediaComponent);
    fixture.componentRef.setInput('title', 'Phishing');
    fixture.componentRef.setInput('imageUrl1', 'javascript:alert(1)');
    fixture.componentRef.setInput('videoUrl', 'https://youtube.com.ejemplo.com/watch?v=abcdefghijk');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('iframe')).toBeNull();
    expect(fixture.nativeElement.querySelector('img')).toBeNull();
    expect(fixture.nativeElement.querySelector('a').getAttribute('rel')).toBe('noopener noreferrer');
  });
});
