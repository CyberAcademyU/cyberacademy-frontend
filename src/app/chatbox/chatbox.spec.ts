import { TestBed } from '@angular/core/testing';
import { ChatboxComponent } from './chatbox';

describe('ChatboxComponent', () => {
  it('opens a guide and returns to the list', async () => {
    const fixture = TestBed.createComponent(ChatboxComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    expect(element.querySelector('.rocu-panel')).toBeNull();

    element.querySelector<HTMLButtonElement>('.rocu-launcher')!.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('¿Qué ocurrió?');

    element.querySelector<HTMLButtonElement>('.rocu-options button')!.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Phishing: correo o página falsa');
    element.querySelector<HTMLButtonElement>('.rocu-options button')!.click();
    fixture.detectChanges();
    expect(element.querySelectorAll('.rocu-steps li').length).toBeGreaterThan(0);

    element.querySelector<HTMLButtonElement>('.rocu-reset')!.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('¿Qué ocurrió?');
  });

  it('filters guides by everyday words and guides phishing choices', () => {
    const fixture = TestBed.createComponent(ChatboxComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.rocu-launcher')!.click();
    fixture.detectChanges();
    const search = element.querySelector<HTMLInputElement>('.rocu-search')!;
    search.value = 'WhatsApp';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    expect(element.textContent).toContain('WhatsApp: cuenta o código robado');
    expect(element.textContent).not.toContain('Vishing: llamada fraudulenta');
    search.value = 'correo';
    search.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.rocu-options button')!.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('¿Qué hiciste después de abrir el enlace?');
    element.querySelector<HTMLButtonElement>('.rocu-options button')!.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Cierra la página');
    expect(element.querySelectorAll('.rocu-steps li').length).toBe(3);
  });

  it('includes common attack guides and supports keyboard movement', () => {
    const fixture = TestBed.createComponent(ChatboxComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.rocu-launcher')!.click();
    fixture.detectChanges();
    expect(element.textContent).toContain('Smishing');
    expect(element.textContent).toContain('Vishing');
    expect(element.textContent).toContain('Ransomware');

    const container = element.querySelector<HTMLElement>('.rocu')!;
    vi.spyOn(container, 'getBoundingClientRect').mockReturnValue({
      left: 100, top: 100, right: 300, bottom: 300, width: 200, height: 200, x: 100, y: 100, toJSON: () => ({}),
    });
    element.querySelector<HTMLElement>('.rocu-drag')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight', bubbles: true }));
    expect(container.style.transform).toBe('translate(10px, 0px)');
  });

  it('opens urgent help and clears checked steps when changing guide', () => {
    const fixture = TestBed.createComponent(ChatboxComponent);
    fixture.detectChanges();
    const element = fixture.nativeElement as HTMLElement;
    element.querySelector<HTMLButtonElement>('.rocu-launcher')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.rocu-urgent')!.click();
    fixture.detectChanges();
    expect(element.querySelector('h2')?.textContent).toContain('Ayuda urgente');
    const checkbox = element.querySelector<HTMLInputElement>('.rocu-step input')!;
    checkbox.click();
    fixture.detectChanges();
    expect(checkbox.checked).toBe(true);
    element.querySelector<HTMLButtonElement>('.rocu-reset')!.click();
    fixture.detectChanges();
    element.querySelector<HTMLButtonElement>('.rocu-urgent')!.click();
    fixture.detectChanges();
    expect(element.querySelector<HTMLInputElement>('.rocu-step input')!.checked).toBe(false);
  });
});
