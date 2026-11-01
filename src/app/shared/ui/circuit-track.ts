import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { IconComponent } from './icon';

export type CircuitState = 'done' | 'current' | 'locked' | 'failed';

export interface CircuitStep {
  label: string;
  state: CircuitState;
  /** La práctica final se dibuja como rombo para distinguirla de las teorías. */
  final?: boolean;
}

const STATE_LABEL: Record<CircuitState, string> = {
  done: 'completada',
  current: 'disponible ahora',
  locked: 'bloqueada',
  failed: 'no aprobada'
};

/**
 * Recorrido secuencial de un módulo dibujado como una pista de circuito:
 * cada sesión es un nodo y el tramo se enciende al completarla.
 */
@Component({
  selector: 'ca-circuit-track',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [IconComponent],
  host: { '[class.is-compact]': 'compact()' },
  template: `
    <ol class="track" [style.--steps]="steps().length">
      @for (step of steps(); track $index) {
        <li class="step" [class]="'is-' + step.state" [class.is-final]="step.final">
          <span class="node">
            @switch (step.state) {
              @case ('done') { <ca-icon name="check" [size]="compact() ? 12 : 16" /> }
              @case ('locked') { <ca-icon name="lock" [size]="compact() ? 11 : 14" /> }
              @case ('failed') { <ca-icon name="close" [size]="compact() ? 11 : 14" /> }
            }
          </span>
          <span [class]="compact() ? 'ca-sr-only' : 'label'">
            {{ step.label }}<span class="ca-sr-only">, {{ stateLabel(step.state) }}</span>
          </span>
        </li>
      }
    </ol>
  `,
  styles: `
    :host {
      --node: 34px;
      display: block;
    }
    :host(.is-compact) {
      --node: 20px;
    }
    .track {
      display: grid;
      grid-template-columns: repeat(var(--steps), 1fr);
      margin: 0;
      padding: 0;
      list-style: none;
    }
    .step {
      position: relative;
      display: grid;
      justify-items: center;
      gap: 10px;
      text-align: center;
    }
    /* Tramo de pista desde el nodo anterior */
    .step:not(:first-child)::before {
      content: '';
      position: absolute;
      top: calc(var(--node) / 2 - 1px);
      right: calc(50% + var(--node) / 2 + 4px);
      left: calc(-50% + var(--node) / 2 + 4px);
      height: 2px;
      background: var(--ca-line-strong);
    }
    .step.is-done:not(:first-child)::before,
    .step.is-failed:not(:first-child)::before {
      background: var(--ca-secure);
      box-shadow: 0 0 8px rgb(var(--ca-secure-rgb) / 0.5);
    }
    .step.is-current:not(:first-child)::before {
      background: linear-gradient(90deg, var(--ca-secure) 0%, var(--ca-signal) 100%);
    }
    /* Pulso de datos viajando hacia la sesión actual */
    .step.is-current:not(:first-child)::after {
      content: '';
      position: absolute;
      top: calc(var(--node) / 2 - 2px);
      left: calc(-50% + var(--node) / 2 + 4px);
      width: 14px;
      height: 4px;
      border-radius: 4px;
      background: #fff;
      box-shadow: 0 0 10px var(--ca-signal);
      animation: travel 2.4s var(--ca-ease-in-out) infinite;
    }
    @keyframes travel {
      0% { transform: translateX(0); opacity: 0; }
      15% { opacity: 1; }
      85% { opacity: 1; }
      100% { transform: translateX(calc(100cqw / var(--steps) - var(--node) - 22px)); opacity: 0; }
    }
    .track {
      container-type: inline-size;
    }
    .node {
      position: relative;
      z-index: 1;
      display: grid;
      place-items: center;
      width: var(--node);
      height: var(--node);
      border: 2px solid var(--ca-line-strong);
      border-radius: 50%;
      background: var(--ca-deck);
      color: var(--ca-text-faint);
      transition: border-color var(--ca-base), background-color var(--ca-base), color var(--ca-base);
    }
    .is-final .node {
      border-radius: 4px;
      transform: rotate(45deg);
    }
    .is-final .node > * {
      transform: rotate(-45deg);
    }
    .is-done .node {
      border-color: var(--ca-secure);
      background: var(--ca-secure);
      color: var(--ca-on-signal);
      animation: lock-in var(--ca-slow) var(--ca-ease-out);
    }
    .is-current .node {
      border-color: var(--ca-signal);
      background: var(--ca-signal-soft);
      box-shadow: var(--ca-glow-signal);
    }
    .is-current .node::after {
      content: '';
      width: 30%;
      height: 30%;
      border-radius: inherit;
      background: var(--ca-signal);
    }
    .is-failed .node {
      border-color: var(--ca-threat);
      background: var(--ca-threat-soft);
      color: var(--ca-threat);
    }
    @keyframes lock-in {
      0% { box-shadow: 0 0 0 0 rgb(var(--ca-secure-rgb) / 0.7); }
      100% { box-shadow: 0 0 0 14px rgb(var(--ca-secure-rgb) / 0); }
    }
    .label {
      color: var(--ca-text-dim);
      font-size: var(--ca-text-xs);
      font-weight: 500;
      line-height: 1.3;
    }
    .is-current .label {
      color: var(--ca-text);
    }
  `
})
export class CircuitTrackComponent {
  steps = input.required<CircuitStep[]>();
  compact = input(false);

  stateLabel(state: CircuitState): string {
    return STATE_LABEL[state];
  }
}
