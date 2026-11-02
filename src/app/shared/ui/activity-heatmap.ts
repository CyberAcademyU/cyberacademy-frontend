import { ChangeDetectionStrategy, Component, ElementRef, afterNextRender, computed, input, viewChild } from '@angular/core';
import { ActivityDay } from '../../core/models/profile.model';

interface Cell {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
  future: boolean;
}

const MONTHS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/** Calendario de las últimas 53 semanas: cada celda es un día y su intensidad, las sesiones completadas. */
@Component({
  selector: 'ca-activity-heatmap',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div #scroller class="scroll" tabindex="0" role="img" [attr.aria-label]="summary()">
      <div class="months" aria-hidden="true">
        @for (month of months(); track month.col) {
          <span [style.grid-column]="month.col + 1">{{ month.label }}</span>
        }
      </div>
      <div class="grid" aria-hidden="true">
        @for (week of weeks(); track $index) {
          @for (cell of week; track cell.date) {
            <span class="cell" [attr.data-level]="cell.level" [class.is-future]="cell.future"
                  [title]="cell.future ? '' : tooltip(cell)"></span>
          }
        }
      </div>
    </div>
    <div class="legend" aria-hidden="true">
      <span>Menos</span>
      @for (level of [0, 1, 2, 3, 4]; track level) {
        <span class="cell" [attr.data-level]="level"></span>
      }
      <span>Más</span>
    </div>
  `,
  styles: `
    :host { display: grid; gap: var(--ca-space-3); min-width: 0; }
    .scroll { overflow-x: auto; padding-bottom: 4px; border-radius: var(--ca-radius-sm); }
    .scroll:focus-visible { outline: none; box-shadow: var(--ca-focus); }
    .months, .grid {
      display: grid;
      grid-template-columns: repeat(53, 9px);
      column-gap: 2px;
      width: max-content;
    }
    .months {
      margin-bottom: 6px;
      color: var(--ca-text-faint);
      font-size: 0.72rem;
    }
    .months span { white-space: nowrap; }
    .grid { grid-template-rows: repeat(7, 9px); grid-auto-flow: column; row-gap: 2px; }
    .grid .cell { width: 9px; height: 9px; }
    .cell {
      display: block;
      width: 12px;
      height: 12px;
      border-radius: 2px;
      background: var(--ca-raised);
    }
    .cell.is-future { background: transparent; }
    .cell[data-level='1'] { background: rgb(var(--ca-secure-rgb) / 0.28); }
    .cell[data-level='2'] { background: rgb(var(--ca-secure-rgb) / 0.5); }
    .cell[data-level='3'] { background: rgb(var(--ca-secure-rgb) / 0.75); }
    .cell[data-level='4'] { background: var(--ca-secure); box-shadow: 0 0 6px rgb(var(--ca-secure-rgb) / 0.6); }
    .legend {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--ca-text-faint);
      font-size: var(--ca-text-xs);
    }
    .legend span:first-child { margin-right: 4px; }
    .legend span:last-child { margin-left: 4px; }
  `
})
export class ActivityHeatmapComponent {
  days = input<ActivityDay[]>([]);

  private scroller = viewChild.required<ElementRef<HTMLElement>>('scroller');

  constructor() {
    // En pantallas estrechas el calendario se desplaza: empezar mostrando las semanas más recientes
    afterNextRender(() => {
      const el = this.scroller().nativeElement;
      el.scrollLeft = el.scrollWidth;
    });
  }

  private counts = computed(() => new Map(this.days().map(day => [day.date, day.count])));

  /** 53 columnas (semanas de lunes a domingo) que terminan en la semana actual. */
  protected weeks = computed<Cell[][]>(() => {
    const counts = this.counts();
    const today = startOfDay(new Date());
    const mondayOffset = (today.getDay() + 6) % 7;
    const start = addDays(today, -mondayOffset - 52 * 7);

    return Array.from({ length: 53 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => {
        const date = addDays(start, w * 7 + d);
        const key = isoDate(date);
        const count = counts.get(key) ?? 0;
        return { date: key, count, level: level(count), future: date > today };
      })
    );
  });

  protected months = computed(() => {
    const result: { col: number; label: string }[] = [];
    let last = -1;
    this.weeks().forEach((week, col) => {
      const month = new Date(week[0].date + 'T00:00:00').getMonth();
      if (month !== last && col < 51) {
        // Si el mes anterior apenas tiene columnas, su etiqueta se solaparía con esta
        if (result.length && col - result[result.length - 1].col < 3) result.pop();
        result.push({ col, label: MONTHS[month] });
      }
      last = month;
    });
    return result;
  });

  protected summary = computed(() => {
    const total = this.days().reduce((sum, day) => sum + day.count, 0);
    const active = this.days().filter(day => day.count > 0).length;
    return `${total} sesiones completadas en ${active} días durante el último año`;
  });

  protected tooltip(cell: Cell): string {
    const date = new Date(cell.date + 'T00:00:00').toLocaleDateString('es', { day: 'numeric', month: 'long' });
    return cell.count === 0
      ? `Sin actividad el ${date}`
      : `${cell.count} ${cell.count === 1 ? 'sesión' : 'sesiones'} el ${date}`;
  }
}

function level(count: number): Cell['level'] {
  if (count <= 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function addDays(date: Date, days: number): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate() + days);
}

function isoDate(date: Date): string {
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${m}-${d}`;
}
