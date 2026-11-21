import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { AuthService } from '../../core/services/auth';
import { StudentOverview } from '../../core/models/admin-dashboard.model';
import { MessagesService, MessageRequest } from '../../core/services/messages';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'app-admin-compose',
  imports: [FormsModule, IconComponent],
  template: `
    <header class="page-head"><h1>Enviar mensaje</h1><p>Comunícate con todos tus estudiantes o con un grupo específico.</p></header>
    @if (success()) { <p class="ca-alert ca-alert--secure" role="status">{{ success() }}</p> }
    @if (error()) { <p class="ca-alert ca-alert--threat" role="alert">{{ error() }}</p> }
    @if (!preview()) {
      <form class="ca-panel composer" (ngSubmit)="review()">
        <fieldset>
          <legend>Destinatarios</legend>
          <label class="choice"><input type="radio" name="audience" value="ALL" [ngModel]="audience()" (ngModelChange)="setAudience($event)" /> Todos los estudiantes activos ({{ eligible().length }})</label>
          <label class="choice"><input type="radio" name="audience" value="SELECTED" [ngModel]="audience()" (ngModelChange)="setAudience($event)" /> Estudiantes específicos</label>
        </fieldset>
        @if (audience() === 'SELECTED') {
          <div class="ca-field">
            <label for="message-search">Buscar por nombre o correo</label>
            <input id="message-search" name="search" class="ca-input" type="search" [ngModel]="query()" (ngModelChange)="query.set($event)" />
          </div>
          <p class="hint">{{ recipients().length }} seleccionados (máximo 500). Solo se muestran estudiantes activos.</p>
          <div class="students" role="group" aria-label="Seleccionar destinatarios">
            @for (student of filtered(); track student.userId) {
              <label class="student">
                <input type="checkbox" [checked]="selected().has(student.userId)" (change)="toggle(student.userId)"
                       [disabled]="!selected().has(student.userId) && recipients().length >= 500" />
                <span><strong>{{ student.firstName }} {{ student.lastName }}</strong><span>{{ student.email }}</span></span>
              </label>
            } @empty { <p class="hint">No hay estudiantes que coincidan con la búsqueda.</p> }
          </div>
        }
        <div class="ca-field">
          <label for="admin-message-body">Mensaje</label>
          <textarea id="admin-message-body" name="body" class="ca-input" rows="7" maxlength="2000" required
                    aria-describedby="message-body-count" [ngModel]="body()" (ngModelChange)="setBody($event)"></textarea>
          <span id="message-body-count" class="ca-field-hint">{{ body().length }} de 2000 caracteres. Se enviará como texto.</span>
        </div>
        <p class="hint">Máximo 5 envíos cada 15 minutos. Los administradores no reciben estos mensajes.</p>
        <button type="submit" class="ca-btn ca-btn--primary" [disabled]="!body().trim() || !recipientCount()"><ca-icon name="mail" /> Revisar envío</button>
      </form>
    } @else {
      <section class="ca-panel composer" aria-label="Confirmar envío del mensaje">
        <h2>Confirmar envío a {{ recipientCount() }} {{ recipientCount() === 1 ? 'estudiante' : 'estudiantes' }}</h2>
        <p>Remitente: <strong>{{ senderName() }}</strong></p>
        <p class="body">{{ preview()!.body }}</p>
        <p class="hint">El mensaje aparecerá en su bandeja y como aviso de 3 segundos. No puedes retirarlo después de enviarlo.</p>
        <div class="actions">
          <button type="button" class="ca-btn ca-btn--primary" [disabled]="sending()" [attr.aria-busy]="sending()" (click)="send()">{{ sending() ? 'Enviando…' : 'Confirmar y enviar' }}</button>
          <button type="button" class="ca-btn" [disabled]="sending()" (click)="preview.set(null)">Volver a editar</button>
        </div>
      </section>
    }
  `,
  styles: `
    :host { display: grid; gap: var(--ca-space-5); }
    h1 { font-size: var(--ca-text-2xl); } h2 { font-size: var(--ca-text-lg); }
    .page-head p, .hint { color: var(--ca-text-dim); font-size: var(--ca-text-sm); }
    .composer { padding: var(--ca-space-5); display: grid; gap: var(--ca-space-4); max-width: 820px; }
    fieldset { border: 0; padding: 0; margin: 0; min-width: 0; display: grid; gap: var(--ca-space-3); }
    legend { margin-bottom: var(--ca-space-3); font-weight: 600; }
    .choice, .student { display: flex; align-items: start; gap: var(--ca-space-3); }
    input[type="checkbox"], input[type="radio"] { accent-color: var(--ca-signal); margin-top: 4px; flex: none; }
    .students { max-height: 300px; overflow-y: auto; border: 1px solid var(--ca-line); border-radius: var(--ca-radius-sm); }
    .student { padding: var(--ca-space-3); min-height: 48px; cursor: pointer; }
    .student > span { display: grid; overflow-wrap: anywhere; min-width: 0; }
    .student span span { color: var(--ca-text-dim); font-size: var(--ca-text-sm); }
    .body { white-space: pre-wrap; overflow-wrap: anywhere; line-height: 1.65; }
    .actions { display: flex; flex-wrap: wrap; gap: var(--ca-space-3); }
  `,
})
export class AdminComposeComponent {
  readonly students = input<StudentOverview[]>([]);
  private service = inject(MessagesService);
  private auth = inject(AuthService);
  private destroy = inject(DestroyRef);
  readonly audience = signal<'ALL' | 'SELECTED'>('ALL');
  readonly selected = signal(new Set<string>());
  readonly query = signal('');
  readonly body = signal('');
  readonly preview = signal<MessageRequest | null>(null);
  readonly sending = signal(false);
  readonly error = signal('');
  readonly success = signal('');
  private requestId: string | null = null;
  readonly eligible = computed(() => this.students().filter(student => student.status === 'ACTIVE'));
  readonly recipients = computed(() => this.eligible().filter(student => this.selected().has(student.userId)).map(student => student.userId));
  readonly recipientCount = computed(() => this.audience() === 'ALL' ? this.eligible().length : this.recipients().length);
  readonly senderName = computed(() => {
    const user = this.auth.currentUserSignal();
    return `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim();
  });
  readonly filtered = computed(() => {
    const query = this.query().trim().toLocaleLowerCase();
    return this.eligible().filter(student => `${student.firstName} ${student.lastName} ${student.email}`.toLocaleLowerCase().includes(query));
  });
  setAudience(value: 'ALL' | 'SELECTED') { this.audience.set(value); this.requestId = null; }
  setBody(value: string) { this.body.set(value); this.requestId = null; }
  toggle(id: string) {
    this.selected.update(old => {
      const next = new Set(old);
      if (next.has(id)) next.delete(id); else if (next.size < 500) next.add(id);
      return next;
    });
    this.requestId = null;
  }
  review() {
    this.error.set(''); this.success.set('');
    if (!this.body().trim() || this.body().length > 2000 || this.recipientCount() < 1 || this.recipients().length > 500) {
      this.error.set('Escribe un mensaje y revisa los destinatarios.'); return;
    }
    this.requestId ??= crypto.randomUUID();
    this.preview.set({ audience: this.audience(), recipientIds: this.audience() === 'ALL' ? [] : this.recipients(),
      body: this.body().trim(), requestId: this.requestId });
  }
  send() {
    const request = this.preview();
    if (!request || this.sending()) return;
    this.sending.set(true); this.error.set('');
    this.service.send(request).pipe(takeUntilDestroyed(this.destroy)).subscribe({
      next: res => {
        this.sending.set(false);
        const count = res.data?.recipientCount ?? 0;
        this.success.set(`Mensaje enviado a ${count} ${count === 1 ? 'estudiante' : 'estudiantes'}.`);
        this.body.set(''); this.selected.set(new Set()); this.preview.set(null); this.requestId = null;
      },
      error: err => { this.sending.set(false); this.error.set(err.error?.message || 'No se pudo confirmar el envío. Puedes reintentarlo sin duplicar el mensaje.'); },
    });
  }
}
