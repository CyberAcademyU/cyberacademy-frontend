import { Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MessagesService } from '../../core/services/messages';
import { IconComponent } from '../../shared/ui/icon';

@Component({
  selector: 'ca-message-notifications',
  imports: [RouterLink, IconComponent],
  template: `
    @if (messages.toast(); as message) {
      <aside class="notification" role="status" aria-live="polite" aria-atomic="true">
        <ca-icon name="mail" [size]="22" />
        <div>
          <strong>{{ message.senderName }}</strong>
          <p>{{ message.body.length > 140 ? message.body.slice(0, 140) + '…' : message.body }}</p>
          <a routerLink="/dashboard/messages" class="ca-link" (click)="messages.dismiss()">Ver mensajes</a>
        </div>
        <button type="button" class="ca-icon-btn" aria-label="Cerrar notificación" (click)="messages.dismiss()">
          <ca-icon name="close" [size]="16" />
        </button>
      </aside>
    }
  `,
  styles: `
    .notification {
      position: fixed; top: calc(env(safe-area-inset-top) + 76px); right: 16px; z-index: 100;
      display: grid; grid-template-columns: auto minmax(0, 1fr) auto; align-items: start;
      gap: var(--ca-space-3); width: min(390px, calc(100vw - 32px)); padding: var(--ca-space-4);
      border: 1px solid var(--ca-signal); border-radius: var(--ca-radius-sm);
      background: var(--ca-deck); color: var(--ca-text); box-shadow: 0 8px 28px #0006;
      overflow-wrap: anywhere;
    }
    p { margin: var(--ca-space-2) 0; font-size: var(--ca-text-sm); color: var(--ca-text-dim); }
    @media (max-width: 600px) { .notification { top: calc(env(safe-area-inset-top) + 12px); } }
  `,
})
export class MessageNotificationsComponent {
  readonly messages = inject(MessagesService);
}
