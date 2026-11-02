import { Directive, HostListener, input } from '@angular/core';

/** Muestra la contraseña únicamente mientras se mantiene presionado el control. */
@Directive({
  selector: '[caRevealPassword]',
  host: { 'aria-label': 'Mantén presionado para ver la contraseña' }
})
export class RevealPasswordDirective {
  caRevealPassword = input.required<HTMLInputElement>();

  @HostListener('pointerdown', ['$event'])
  onPointerDown(event: PointerEvent): void {
    if (event.button !== 0) return;
    (event.currentTarget as HTMLElement).setPointerCapture(event.pointerId);
    this.show();
  }

  @HostListener('pointerup')
  @HostListener('pointercancel')
  @HostListener('lostpointercapture')
  @HostListener('blur')
  hide(): void {
    this.caRevealPassword().type = 'password';
  }

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') {
      event.preventDefault();
      this.show();
    }
  }

  @HostListener('keyup', ['$event'])
  onKeyUp(event: KeyboardEvent): void {
    if (event.key === ' ' || event.key === 'Enter') this.hide();
  }

  private show(): void {
    this.caRevealPassword().type = 'text';
  }
}
