import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

interface AvatarPalette {
  name: string;
  bg: [string, string];
  body: string;
  accent: string;
}

/** Catálogo cerrado de avatares (el backend solo acepta estos ids: no hay subida de imágenes). */
export const AVATARS: Record<string, AvatarPalette> = {
  'op-01': { name: 'Visor', bg: ['#0f2a44', '#07121f'], body: '#c9d6ea', accent: '#3ee6ff' },
  'op-02': { name: 'Capucha', bg: ['#2a1640', '#0b0717'], body: '#6d4fa8', accent: '#41f5a0' },
  'op-03': { name: 'Droide', bg: ['#13342b', '#06120e'], body: '#9fb4a9', accent: '#ffc24d' },
  'op-04': { name: 'Búho', bg: ['#3a2a12', '#120c05'], body: '#b98a4e', accent: '#ffe08a' },
  'op-05': { name: 'Zorro', bg: ['#3d1a14', '#130705'], body: '#e07a45', accent: '#fff1e0' },
  'op-06': { name: 'Terminal', bg: ['#102238', '#050b14'], body: '#8193b6', accent: '#41f5a0' },
  'op-07': { name: 'Máscara', bg: ['#2b0f1d', '#0e0409'], body: '#e4ecf8', accent: '#ff5577' },
  'op-08': { name: 'Escudo', bg: ['#0d2f3a', '#041014'], body: '#2fbfae', accent: '#e4ecf8' }
};

export const AVATAR_IDS = Object.keys(AVATARS);

let nextId = 0;

/** Avatar de operador en SVG. Sin avatar elegido muestra las iniciales. */
@Component({
  selector: 'ca-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', '[style.--size.px]': 'size()' },
  template: `
    @if (palette(); as p) {
      <svg viewBox="0 0 64 64" [attr.width]="size()" [attr.height]="size()"
           [style.--body]="p.body" [style.--accent]="p.accent">
        <defs>
          <radialGradient [attr.id]="gradientId" cx="50%" cy="35%" r="70%">
            <stop offset="0" [attr.stop-color]="p.bg[0]" />
            <stop offset="1" [attr.stop-color]="p.bg[1]" />
          </radialGradient>
        </defs>
        <circle cx="32" cy="32" r="32" [attr.fill]="'url(#' + gradientId + ')'" />
        <path class="body dim" d="M10 64c2-11 11-17 22-17s20 6 22 17z" />
        @switch (avatar()) {
          @case ('op-01') {
            <path class="body" d="M18 30a14 14 0 0 1 28 0v6c0 6-6 10-14 10s-14-4-14-10z" />
            <rect class="accent glow" x="20" y="28" width="24" height="7" rx="3.5" />
          }
          @case ('op-02') {
            <path class="body" d="M32 12c-11 0-17 10-17 22 0 6 3 11 8 13h18c5-2 8-7 8-13 0-12-6-22-17-22z" />
            <ellipse class="void" cx="32" cy="34" rx="9" ry="10" />
            <circle class="accent glow" cx="28.5" cy="33" r="1.8" />
            <circle class="accent glow" cx="35.5" cy="33" r="1.8" />
          }
          @case ('op-03') {
            <path class="stroke" d="M32 20v-6" />
            <circle class="accent" cx="32" cy="12.5" r="2.2" />
            <rect class="body" x="19" y="20" width="26" height="22" rx="4" />
            <rect class="accent glow" x="24" y="27" width="5" height="5" rx="1" />
            <rect class="accent glow" x="35" y="27" width="5" height="5" rx="1" />
            <path class="void-stroke" d="M25 37h14" stroke-dasharray="2 2" />
          }
          @case ('op-04') {
            <path class="body" d="M18 22l6 5h16l6-5v14c0 8-6 12-14 12s-14-4-14-12z" />
            <circle class="void ring" cx="26" cy="32" r="5" />
            <circle class="void ring" cx="38" cy="32" r="5" />
            <circle class="accent" cx="26" cy="32" r="1.8" />
            <circle class="accent" cx="38" cy="32" r="1.8" />
            <path class="accent" d="M30.5 37l1.5 3 1.5-3z" />
          }
          @case ('op-05') {
            <path class="body" d="M17 18l9 8h12l9-8-2 16c-1 7-7 12-13 12s-12-5-13-12z" />
            <path class="accent" d="M22 36c3 2 6 3 10 3s7-1 10-3c-1 5-5 9-10 9s-9-4-10-9z" />
            <path class="void-stroke" d="M24 31l5 1.5M40 31l-5 1.5" />
            <circle class="void" cx="32" cy="40" r="1.6" />
          }
          @case ('op-06') {
            <path class="body" d="M28 42h8v5h-8z" />
            <rect class="body" x="16" y="18" width="32" height="24" rx="3" />
            <rect class="void" x="19" y="21" width="26" height="18" rx="1.5" />
            <path class="accent-stroke glow" d="M23 27l4 3-4 3M29 34h7" />
          }
          @case ('op-07') {
            <path class="body" d="M20 22h24l2 10c0 9-6 15-14 15s-14-6-14-15z" />
            <path class="void" d="M23 30l7 2-1 2.5-6-1.5zM41 30l-7 2 1 2.5 6-1.5z" />
            <path class="accent-stroke" d="M32 22v7M28 41h8" />
          }
          @case ('op-08') {
            <path class="body" d="M32 14l14 5v11c0 9-6 15-14 18-8-3-14-9-14-18V19z" />
            <circle class="void" cx="32" cy="29" r="3.5" />
            <path class="void" d="M30.4 31h3.2l1 7h-5.2z" />
            <circle class="accent glow" cx="24" cy="22" r="1.4" />
            <circle class="accent glow" cx="40" cy="22" r="1.4" />
          }
        }
      </svg>
    } @else {
      <span class="initials">{{ initials() }}</span>
    }
  `,
  styles: `
    :host {
      display: inline-grid;
      flex: none;
      place-items: center;
      width: var(--size);
      height: var(--size);
      overflow: hidden;
      border-radius: 50%;
      box-shadow: 0 0 0 1px var(--ca-line-strong);
    }
    svg { display: block; width: 100%; height: 100%; }
    .body { fill: var(--body); }
    .dim { opacity: 0.55; }
    .accent { fill: var(--accent); }
    .void { fill: var(--ca-void); }
    .ring { stroke: var(--accent); stroke-width: 1.6; }
    .stroke, .void-stroke, .accent-stroke {
      fill: none;
      stroke-width: 2.4;
      stroke-linecap: round;
      stroke-linejoin: round;
    }
    .stroke { stroke: var(--body); }
    .void-stroke { stroke: var(--ca-void); }
    .accent-stroke { stroke: var(--accent); }
    .glow { filter: drop-shadow(0 0 2px var(--accent)); }
    .initials {
      display: grid;
      place-items: center;
      width: 100%;
      height: 100%;
      background: var(--ca-raised);
      color: var(--ca-text);
      font-family: var(--ca-font-display);
      font-size: calc(var(--size) * 0.38);
      font-weight: 600;
    }
  `
})
export class AvatarComponent {
  avatar = input<string | null | undefined>(null);
  name = input('');
  size = input(40);

  protected readonly gradientId = `ca-avatar-${nextId++}`;
  protected palette = computed(() => {
    const id = this.avatar();
    return id ? AVATARS[id] ?? null : null;
  });
  protected initials = computed(() =>
    this.name()
      .split(/[\s._-]+/)
      .filter(Boolean)
      .slice(0, 2)
      .map(part => part[0]!.toUpperCase())
      .join('') || '?'
  );
}
