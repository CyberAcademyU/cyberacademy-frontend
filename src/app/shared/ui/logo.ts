import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Marca de CyberAcademy: escudo trazado como una placa de circuito. */
@Component({
  selector: 'ca-logo',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <svg class="mark" viewBox="0 0 32 32" fill="none" [attr.width]="size()" [attr.height]="size()" aria-hidden="true">
      <path d="M16 2.5l11.5 4.2v8.6c0 7-4.9 12.3-11.5 14.2C9.4 27.6 4.5 22.3 4.5 15.3V6.7z"
            stroke="currentColor" stroke-width="1.8" stroke-linejoin="round" />
      <path d="M9.5 13.5h4l2-2h7M9.5 18.5h6.5l2 2h4" stroke="var(--ca-signal)" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round" />
      <circle cx="22.5" cy="11.5" r="1.7" fill="var(--ca-signal)" />
      <circle cx="22" cy="20.5" r="1.7" fill="var(--ca-warn)" />
    </svg>
    @if (!compact()) {
      <span class="word">Cyber<span>Academy</span></span>
    }
  `,
  styles: `
    :host {
      display: inline-flex;
      align-items: center;
      gap: 10px;
      color: var(--ca-text);
    }
    .mark {
      flex: none;
    }
    .word {
      font-family: var(--ca-font-display);
      font-size: 1.2rem;
      font-weight: 700;
      letter-spacing: 0.01em;
    }
    .word span {
      color: var(--ca-signal);
    }
  `
})
export class LogoComponent {
  size = input(30);
  compact = input(false);
}
