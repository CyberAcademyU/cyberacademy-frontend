import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';

export interface LinePoint {
  label: string;
  value: number;
  /** Texto adicional para el tooltip (por ejemplo, el nombre completo del módulo). */
  detail?: string;
}

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 18, right: 18, bottom: 38, left: 46 };

let nextGradientId = 0;

/**
 * Gráfica de líneas responsive dibujada con SVG. Cada punto se proyecta sobre
 * un eje de 0 a `max` y se acompaña de una etiqueta corta en el eje X.
 */
@Component({
  selector: 'ca-line-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'summary()' },
  template: `
    <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height" aria-hidden="true">
      <defs>
        <linearGradient [attr.id]="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--ca-secure)" stop-opacity="0.28" />
          <stop offset="100%" stop-color="var(--ca-secure)" stop-opacity="0" />
        </linearGradient>
      </defs>

      @for (tick of chart().ticks; track tick.value) {
        <line
          class="grid"
          [attr.x1]="pad.left"
          [attr.y1]="tick.y"
          [attr.x2]="width() - pad.right"
          [attr.y2]="tick.y"
        />
        <text class="axis" [attr.x]="pad.left - 10" [attr.y]="tick.y + 4" text-anchor="end">
          {{ tick.label }}
        </text>
      }

      @if (chart().area) {
        <path class="area" [attr.d]="chart().area" [attr.fill]="'url(#' + gradientId + ')'" />
      }
      @if (chart().line) {
        <path class="line" [attr.d]="chart().line" />
      }

      @for (point of chart().points; track $index) {
        <circle class="dot" [attr.cx]="point.x" [attr.cy]="point.y" r="4">
          <title>
            {{ point.label }}{{ point.detail ? ' · ' + point.detail : '' }}: {{ point.value
            }}{{ unit() }}
          </title>
        </circle>
        <text class="point-value" [attr.x]="point.x" [attr.y]="point.y - 12" text-anchor="middle">
          {{ point.value }}{{ unit() }}
        </text>
        @if (point.showLabel) {
          <text class="axis axis--x" [attr.x]="point.x" [attr.y]="height - 14" text-anchor="middle">
            {{ point.label }}
          </text>
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: block;
      min-width: 0;
    }
    svg {
      display: block;
      width: 100%;
      height: auto;
      overflow: visible;
    }
    .grid {
      stroke: var(--ca-line);
      stroke-width: 1;
      stroke-dasharray: 3 5;
    }
    .axis {
      fill: var(--ca-text-faint);
      font-family: var(--ca-font-code);
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }
    .axis--x {
      font-family: var(--ca-font-body);
      font-size: 12px;
    }
    .area {
      pointer-events: none;
    }
    .line {
      fill: none;
      stroke: var(--ca-secure);
      stroke-width: 2.5;
      stroke-linecap: round;
      stroke-linejoin: round;
      filter: drop-shadow(0 0 6px rgb(var(--ca-secure-rgb) / 0.45));
    }
    .dot {
      fill: var(--ca-deck);
      stroke: var(--ca-secure);
      stroke-width: 2.5;
    }
    .dot:hover {
      fill: var(--ca-secure);
    }
    .point-value {
      fill: var(--ca-text-dim);
      font-family: var(--ca-font-code);
      font-size: 11px;
      font-variant-numeric: tabular-nums;
    }
  `,
})
export class LineChartComponent {
  points = input.required<LinePoint[]>();
  max = input(100);
  unit = input('%');

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);
  protected readonly width = signal(WIDTH);
  protected readonly height = HEIGHT;
  protected readonly pad = PAD;
  protected readonly gradientId = `ca-line-gradient-${nextGradientId++}`;

  constructor() {
    afterNextRender(() => {
      const element = this.host.nativeElement;
      this.width.set(Math.round(element.clientWidth) || WIDTH);
      if (typeof ResizeObserver === 'undefined') {
        return;
      }

      const observer = new ResizeObserver(([entry]) => {
        const width = Math.round(entry.contentRect.width);
        if (width > 0) {
          this.width.set(width);
        }
      });
      observer.observe(element);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  protected readonly chart = computed(() => {
    const points = this.points();
    const width = this.width();
    const max = Math.max(1, this.max());
    const innerWidth = width - PAD.left - PAD.right;
    const innerHeight = HEIGHT - PAD.top - PAD.bottom;
    const bottom = PAD.top + innerHeight;
    const showEveryLabel = points.length <= 8;

    const coords = points.map((point, index) => {
      const value = Math.max(0, Math.min(max, point.value));
      const x =
        points.length === 1
          ? PAD.left + innerWidth / 2
          : PAD.left + (index / (points.length - 1)) * innerWidth;
      const y = bottom - (value / max) * innerHeight;

      return {
        x,
        y,
        value: Math.round(value),
        label: point.label,
        detail: point.detail,
        showLabel: showEveryLabel || index % 2 === 0,
      };
    });

    const line =
      coords.length > 0
        ? coords
            .map(
              (point, index) =>
                `${index === 0 ? 'M' : 'L'}${point.x.toFixed(1)} ${point.y.toFixed(1)}`,
            )
            .join(' ')
        : '';

    const area =
      coords.length > 0
        ? [
            `M${coords[0].x.toFixed(1)} ${bottom}`,
            ...coords.map((point) => `L${point.x.toFixed(1)} ${point.y.toFixed(1)}`),
            `L${coords[coords.length - 1].x.toFixed(1)} ${bottom}`,
            'Z',
          ].join(' ')
        : '';

    const ticks = Array.from({ length: 5 }, (_, index) => {
      const value = Math.round((max / 4) * index);
      return {
        value,
        y: bottom - (value / max) * innerHeight,
        label: `${value}${this.unit()}`,
      };
    });

    return { points: coords, line, area, ticks };
  });

  protected readonly summary = computed(() => {
    const points = this.points();
    if (points.length === 0) {
      return 'Gráfica de líneas sin datos';
    }
    const detail = points
      .map((point) => `${point.label} ${Math.round(point.value)}${this.unit()}`)
      .join(', ');
    return `Gráfica de líneas. ${detail}`;
  });
}
