import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Anillo de progreso (0–100) con la cifra en el centro. */
@Component({
  selector: 'ca-progress-ring',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'label() + ": " + rounded() + "%"' },
  template: `
    <svg [attr.width]="size()" [attr.height]="size()" viewBox="0 0 100 100" aria-hidden="true">
      <circle class="track" cx="50" cy="50" r="44" />
      <circle class="value" cx="50" cy="50" r="44" pathLength="100"
              [attr.stroke-dasharray]="rounded() + ' 100'" />
    </svg>
    <span class="figure">{{ rounded() }}<small>%</small></span>
  `,
  styles: `
    :host {
      position: relative;
      display: inline-grid;
      place-items: center;
      flex: none;
    }
    svg {
      transform: rotate(-90deg);
    }
    circle {
      fill: none;
      stroke-width: 7;
    }
    .track {
      stroke: var(--ca-raised);
    }
    .value {
      stroke: var(--ca-secure);
      stroke-linecap: round;
      filter: drop-shadow(0 0 6px rgb(var(--ca-secure-rgb) / 0.55));
      transition: stroke-dasharray var(--ca-slow) var(--ca-ease-out);
    }
    .figure {
      position: absolute;
      font-family: var(--ca-font-display);
      font-size: 1.6rem;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
    small {
      margin-left: 1px;
      color: var(--ca-text-dim);
      font-size: 0.55em;
    }
  `
})
export class ProgressRingComponent {
  value = input(0);
  size = input(112);
  label = input('Avance');

  rounded = computed(() => Math.max(0, Math.min(100, Math.round(this.value()))));
}
