import { Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AppHeaderComponent } from '../../shared/ui/app-header';
import { IconComponent } from '../../shared/ui/icon';
import { MessagesService, StudentMessage } from '../../core/services/messages';

@Component({
  selector: 'app-message-inbox',
  imports: [AppHeaderComponent, IconComponent, DatePipe],
  template: `
    <ca-app-header />
    <main class="page">
      <header class="heading">
        <div><h1>Mensajes</h1><p>Comunicaciones de tus administradores.</p></div>
        <button type="button" class="ca-btn" [disabled]="!items().length || busy() || loading()" (click)="confirmClear.set(true)">
          <ca-icon name="trash" /> Vaciar bandeja
        </button>
      </header>
      @if (confirmClear()) {
        <section class="ca-panel confirmation" aria-label="Confirmar vaciado">
          <strong>¿Vaciar tu bandeja de entrada?</strong>
          <p>No podrás recuperar estos mensajes. No se borrarán de las bandejas de otros estudiantes.</p>
          <div class="actions">
            <button type="button" class="ca-btn ca-btn--danger" [disabled]="busy()" [attr.aria-busy]="busy()" (click)="clear()">Sí, vaciar</button>
            <button type="button" class="ca-btn" [disabled]="busy()" (click)="confirmClear.set(false)">Cancelar</button>
          </div>
        </section>
      }
      @if (error()) {
        <div class="ca-alert ca-alert--threat" role="alert">{{ error() }}
          <button type="button" class="ca-link" [disabled]="loading()" (click)="load()">Reintentar</button>
        </div>
      }
      @if (loading() && !items().length) { <p class="ca-loader" role="status">Cargando mensajes…</p> }
      @if (!loading() && !error() && !items().length) {
        <section class="ca-state"><ca-icon name="mail" [size]="28" /><strong>Tu bandeja está vacía</strong><span>Los mensajes que recibas aparecerán aquí.</span></section>
      }
      <div class="list">
        @for (message of items(); track message.id) {
          <article class="ca-panel message" [class.unread]="!message.readAt">
            <header class="heading">
              <div>
                <h2>{{ message.senderName }}</h2>
                <time [attr.datetime]="message.createdAt">{{ message.createdAt | date:'dd/MM/yyyy HH:mm' }}</time>
                @if (!message.readAt) { <span class="unread-label">Sin leer</span> }
              </div>
              <button type="button" class="ca-icon-btn" [disabled]="busy()" (click)="remove(message.id)"
                      [attr.aria-label]="'Eliminar mensaje de ' + message.senderName"><ca-icon name="trash" /></button>
            </header>
            @if (opened() === message.id) {
              <p class="body">{{ message.body }}</p>
              <button type="button" class="ca-link" (click)="opened.set(null)">Cerrar mensaje</button>
            } @else {
              <p class="preview">{{ message.body.length > 120 ? message.body.slice(0, 120) + '…' : message.body }}</p>
              <button type="button" class="ca-link" [disabled]="busy() || loading()" (click)="open(message)">Leer mensaje</button>
            }
          </article>
        }
      </div>
      @if (nextBefore()) {
        <button type="button" class="ca-btn more" [disabled]="loading() || busy()" [attr.aria-busy]="loading()" (click)="load(true)">Cargar anteriores</button>
      }
    </main>
  `,
  styles: `
    .page { display: grid; gap: var(--ca-space-5); width: min(calc(100% - 32px), 960px); margin: auto; padding: var(--ca-space-6) 0 100px; }
    .heading { display: flex; align-items: start; justify-content: space-between; gap: var(--ca-space-3); flex-wrap: wrap; }
    h1 { font-size: var(--ca-text-2xl); } h2 { font-size: var(--ca-text-md); }
    .heading p, time, .preview { color: var(--ca-text-dim); font-size: var(--ca-text-sm); }
    .list { display: grid; gap: var(--ca-space-3); }
    .message, .confirmation { padding: var(--ca-space-5); display: grid; gap: var(--ca-space-3); overflow-wrap: anywhere; }
    .message.unread { border-left: 3px solid var(--ca-signal); }
    .unread-label { color: var(--ca-signal); font-size: var(--ca-text-xs); margin-left: var(--ca-space-3); }
    .body { white-space: pre-wrap; line-height: 1.65; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--ca-space-3); }
    .more { justify-self: center; } .ca-link { justify-self: start; }
  `,
})
export class MessageInboxComponent implements OnInit {
  private messages = inject(MessagesService);
  private destroy = inject(DestroyRef);
  readonly items = signal<StudentMessage[]>([]);
  readonly loading = signal(false);
  readonly busy = signal(false);
  readonly error = signal('');
  readonly nextBefore = signal<number | null>(null);
  readonly opened = signal<number | null>(null);
  readonly confirmClear = signal(false);
  ngOnInit() { this.load(); }
  load(more = false) {
    if (this.loading() || this.busy()) return;
    this.loading.set(true); this.error.set('');
    this.messages.inbox(more ? this.nextBefore() ?? undefined : undefined)
      .pipe(takeUntilDestroyed(this.destroy)).subscribe({
        next: res => {
          this.loading.set(false);
          if (!res.data) return;
          this.items.set(more ? [...this.items(), ...res.data.items] : res.data.items);
          this.nextBefore.set(res.data.nextBefore);
        },
        error: () => { this.loading.set(false); this.error.set('No se pudo cargar tu bandeja.'); },
      });
  }
  open(message: StudentMessage) {
    if (this.busy() || this.loading()) return;
    this.error.set('');
    this.opened.set(message.id);
    if (message.readAt) return;
    this.busy.set(true);
    this.messages.markRead(message.id).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => {
        this.busy.set(false);
        this.items.update(items => items.map(item => item.id === message.id ? { ...item, readAt: new Date().toISOString() } : item));
      },
      error: () => { this.busy.set(false); this.error.set('No se pudo marcar el mensaje como leído.'); },
    });
  }
  remove(id: number) {
    if (this.busy() || this.loading()) return;
    this.busy.set(true); this.error.set('');
    this.messages.delete(id).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.busy.set(false); this.items.update(items => items.filter(item => item.id !== id)); },
      error: () => { this.busy.set(false); this.error.set('No se pudo eliminar el mensaje.'); },
    });
  }
  clear() {
    if (!this.confirmClear() || this.busy() || this.loading()) return;
    this.busy.set(true); this.error.set('');
    this.messages.clear().pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: () => { this.busy.set(false); this.items.set([]); this.nextBefore.set(null); this.confirmClear.set(false); },
      error: () => { this.busy.set(false); this.error.set('No se pudo vaciar tu bandeja.'); },
    });
  }
}
