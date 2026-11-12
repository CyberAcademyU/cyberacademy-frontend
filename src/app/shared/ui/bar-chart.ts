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

export type BarTone = 'signal' | 'secure' | 'warn' | 'threat';

export interface BarSeries {
  label: string;
  tone: BarTone;
}

export interface BarGroup {
  label: string;
  values: number[];
  /** Texto adicional para el tooltip (por ejemplo, el nombre completo del módulo). */
  detail?: string;
}

const WIDTH = 640;
const HEIGHT = 240;
const PAD = { top: 18, right: 18, bottom: 38, left: 46 };

/**
 * Gráfica de barras agrupadas responsive dibujada con SVG. Cada grupo muestra
 * una barra por serie, con los colores de estado de la paleta.
 */
@Component({
  selector: 'ca-bar-chart',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { role: 'img', '[attr.aria-label]': 'summary()' },
  template: `
    <ul class="legend" aria-hidden="true">
      @for (item of series(); track item.label) {
        <li><span class="swatch" [attr.data-tone]="item.tone"></span>{{ item.label }}</li>
      }
    </ul>

    <svg [attr.viewBox]="'0 0 ' + width() + ' ' + height" aria-hidden="true">
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

      @for (bar of chart().bars; track $index) {
        <rect
          class="bar"
          [attr.data-tone]="bar.tone"
          [attr.x]="bar.x"
          [attr.y]="bar.y"
          [attr.width]="bar.width"
          [attr.height]="bar.height"
          rx="3"
        >
          <title>{{ bar.title }}</title>
        </rect>
      }

      @for (label of chart().labels; track $index) {
        @if (label.show) {
          <text class="axis axis--x" [attr.x]="label.x" [attr.y]="height - 14" text-anchor="middle">
            {{ label.label }}
          </text>
        }
      }
    </svg>
  `,
  styles: `
    :host {
      display: grid;
      gap: var(--ca-space-3);
      min-width: 0;
    }
    .legend {
      display: flex;
      flex-wrap: wrap;
      gap: var(--ca-space-2) var(--ca-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
      color: var(--ca-text-dim);
      font-size: var(--ca-text-xs);
    }
    .legend li {
      display: inline-flex;
      align-items: center;
      gap: var(--ca-space-2);
    }
    .swatch {
      width: 9px;
      height: 9px;
      border-radius: 2px;
    }
    .swatch[data-tone='signal'] {
      background: var(--ca-signal);
    }
    .swatch[data-tone='secure'] {
      background: var(--ca-secure);
    }
    .swatch[data-tone='warn'] {
      background: var(--ca-warn);
    }
    .swatch[data-tone='threat'] {
      background: var(--ca-threat);
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
    .bar {
      transition: opacity var(--ca-fast) var(--ca-ease-out);
    }
    .bar:hover {
      opacity: 0.78;
    }
    .bar[data-tone='signal'] {
      fill: var(--ca-signal);
    }
    .bar[data-tone='secure'] {
      fill: var(--ca-secure);
    }
    .bar[data-tone='warn'] {
      fill: var(--ca-warn);
    }
    .bar[data-tone='threat'] {
      fill: var(--ca-threat);
    }
  `,
})
export class BarChartComponent {
  groups = input.required<BarGroup[]>();
  series = input.required<BarSeries[]>();

  private host = inject<ElementRef<HTMLElement>>(ElementRef);
  private destroyRef = inject(DestroyRef);
  protected readonly width = signal(WIDTH);
  protected readonly height = HEIGHT;
  protected readonly pad = PAD;

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
    const groups = this.groups();
    const series = this.series();
    const innerWidth = this.width() - PAD.left - PAD.right;
    const innerHeight = HEIGHT - PAD.top - PAD.bottom;
    const bottom = PAD.top + innerHeight;
    const max = niceMax(Math.max(1, ...groups.flatMap((group) => group.values)));
    const groupWidth = groups.length > 0 ? innerWidth / groups.length : innerWidth;
    const gap = 5;
    const barWidth =
      series.length > 0
        ? Math.min(22, Math.max(4, (groupWidth * 0.7 - gap * (series.length - 1)) / series.length))
        : 0;
    const clusterWidth = barWidth * series.length + gap * Math.max(0, series.length - 1);

    const bars = groups.flatMap((group, groupIndex) => {
      const start = PAD.left + groupIndex * groupWidth + (groupWidth - clusterWidth) / 2;
      return group.values.slice(0, series.length).map((value, seriesIndex) => {
        const safeValue = Math.max(0, value);
        const height = (safeValue / max) * innerHeight;
        return {
          x: start + seriesIndex * (barWidth + gap),
          y: bottom - height,
          width: barWidth,
          height,
          tone: series[seriesIndex].tone,
          title: `${group.label}${group.detail ? ' · ' + group.detail : ''} · ${series[seriesIndex].label}: ${value}`,
        };
      });
    });

    const ticks = Array.from({ length: 5 }, (_, index) => {
      const value = (max / 4) * index;
      return {
        value,
        y: bottom - (value / max) * innerHeight,
        label: formatTick(value),
      };
    });

    const showEveryLabel = groups.length <= 8;
    const labels = groups.map((group, index) => ({
      x: PAD.left + index * groupWidth + groupWidth / 2,
      label: group.label,
      show: showEveryLabel || index % 2 === 0,
    }));

    return { bars, ticks, labels, max };
  });

  protected readonly summary = computed(() => {
    const groups = this.groups();
    const series = this.series();
    if (groups.length === 0) {
      return 'Gráfica de barras sin datos';
    }
    const detail = groups
      .map((group) => {
        const values = series
          .map((item, index) => `${item.label} ${group.values[index] ?? 0}`)
          .join(', ');
        return `${group.label}: ${values}`;
      })
      .join('; ');
    return `Gráfica de barras. ${detail}`;
  });
}

/** Redondea el máximo a un valor legible para el eje (2, 4, 5, 8, 10, 20, 50...). */
function niceMax(value: number): number {
  if (value <= 4) {
    return 4;
  }
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const normalized = value / magnitude;
  const factor =
    normalized <= 2 ? 2 : normalized <= 4 ? 4 : normalized <= 5 ? 5 : normalized <= 8 ? 8 : 10;
  return factor * magnitude;
}

function formatTick(value: number): string {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}
