import { afterNextRender, ChangeDetectionStrategy, Component, DestroyRef, ElementRef, HostListener, inject, Injector, signal, viewChild } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { environment } from '../../environments/environment';
import { RocuAvatarComponent } from './rocu-avatar';

@Component({
  selector: 'ca-chatbox',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RocuAvatarComponent],
  templateUrl: './chatbox.html',
  styleUrl: './chatbox.css',
})
export class ChatboxComponent {
  readonly isOpen = signal(false);
  readonly showIntroduction = signal(true);
  readonly draft = signal('');
  readonly turns = signal<{question: string; answer: string}[]>([]);
  readonly pending = signal('');
  readonly error = signal('');
  private readonly http = inject(HttpClient);
  private readonly injector = inject(Injector);
  private readonly transcript = viewChild<ElementRef<HTMLElement>>('transcript');
  private request?: Subscription;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.request?.unsubscribe());
  }

  send(): void {
    const message = this.draft().trim();
    if (!message || message.length > 1200 || this.pending()) return;
    this.pending.set(message);
    this.draft.set('');
    this.error.set('');
    this.scrollToLatest();
    const history = this.turns().slice(-4).map(t => ({ ...t, answer: t.answer.slice(0, 4000) }));
    this.request = this.http.post<{data: string}>(`${environment.apiUrl}/rocu/chat`, { message, history }).subscribe({
      next: response => {
        this.pending.set('');
        this.turns.update(turns => [...turns.slice(-19), { question: message, answer: response.data }]);
        this.scrollToLatest();
      },
      error: (err: HttpErrorResponse) => {
        this.pending.set('');
        this.draft.set(message);
        this.error.set(err.status === 429 ? 'Se alcanzó el límite de consultas. Intenta más tarde.' :
          'Rocu no pudo responder. Tu mensaje sigue aquí para que puedas reintentarlo.');
      },
    });
  }

  private scrollToLatest(): void {
    afterNextRender(() => {
      const el = this.transcript()?.nativeElement;
      if (el) el.scrollTop = el.scrollHeight;
    }, { injector: this.injector });
  }
  private readonly container = viewChild.required<ElementRef<HTMLElement>>('rocuContainer');
  private position = { x: 0, y: 0 };
  private drag: { pointerId: number; x: number; y: number; startX: number; startY: number } | null = null;

  open(): void {
    this.showIntroduction.set(false);
    this.isOpen.set(true);
  }

  close(): void {
    this.isOpen.set(false);
    this.request?.unsubscribe();
    this.turns.set([]);
    this.draft.set('');
    this.pending.set('');
    this.error.set('');
    this.drag = null;
    this.position = { x: 0, y: 0 };
    this.container().nativeElement.style.transform = '';
  }

  startDrag(event: PointerEvent): void {
    if (!event.isPrimary || (event.pointerType === 'mouse' && event.button !== 0)) return;
    const handle = event.currentTarget as HTMLElement;
    handle.setPointerCapture(event.pointerId);
    this.drag = { pointerId: event.pointerId, x: event.clientX, y: event.clientY, startX: this.position.x, startY: this.position.y };
  }

  moveDrag(event: PointerEvent): void {
    if (!this.drag || this.drag.pointerId !== event.pointerId) return;
    this.moveTo(this.drag.startX + event.clientX - this.drag.x, this.drag.startY + event.clientY - this.drag.y);
  }

  endDrag(event: PointerEvent): void {
    if (this.drag?.pointerId === event.pointerId) this.drag = null;
  }

  moveWithKeyboard(event: KeyboardEvent): void {
    const directions: Record<string, [number, number]> = {
      ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1],
    };
    const direction = directions[event.key];
    if (!direction) return;
    event.preventDefault();
    const distance = event.shiftKey ? 40 : 10;
    this.moveTo(this.position.x + direction[0] * distance, this.position.y + direction[1] * distance);
  }

  @HostListener('window:resize')
  keepInViewport(): void {
    if (this.isOpen()) this.moveTo(this.position.x, this.position.y);
  }

  private moveTo(x: number, y: number): void {
    const element = this.container().nativeElement;
    const rect = element.getBoundingClientRect();
    const baseLeft = rect.left - this.position.x;
    const baseTop = rect.top - this.position.y;
    const margin = 8;
    const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), Math.max(min, max));
    this.position = {
      x: clamp(x, margin - baseLeft, window.innerWidth - margin - rect.width - baseLeft),
      y: clamp(y, margin - baseTop, window.innerHeight - margin - rect.height - baseTop),
    };
    element.style.transform = `translate(${this.position.x}px, ${this.position.y}px)`;
  }
}
