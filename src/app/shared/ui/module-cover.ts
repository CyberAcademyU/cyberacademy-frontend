import { ChangeDetectionStrategy, Component, computed, input } from '@angular/core';

/** Catálogo cerrado de portadas (mismas claves que ModuleCover en el backend). */
export const MODULE_COVERS = [
  { key: 'intro', label: 'Globo conectado' },
  { key: 'inbox', label: 'Correo con anzuelo' },
  { key: 'password', label: 'Candado y contraseña' },
  { key: 'profile', label: 'Perfil expuesto' },
  { key: 'photo', label: 'Foto con ubicación' },
  { key: 'wifi', label: 'Red Wi-Fi gemela' },
  { key: 'challenge', label: 'Escudo bajo ataque' },
  { key: 'exam', label: 'Progreso y evaluación' },
  { key: 'prism', label: 'Prisma (abstracta)' },
  { key: 'tunnel', label: 'Túnel de luz (abstracta)' }
] as const;

export type ModuleCoverKey = (typeof MODULE_COVERS)[number]['key'];

interface Tone {
  /** Centro y borde del fondo radial: la luz de la escena. */
  bg1: string;
  bg2: string;
  /** Posición del foco de luz (0–1). */
  cx: number;
  cy: number;
}

const COOL: Tone = { bg1: '#1f2f86', bg2: '#0a0e26', cx: 0.55, cy: 0.45 };
const WARM: Tone = { bg1: '#6a2109', bg2: '#1c0a06', cx: 0.62, cy: 0.4 };
const MIXED: Tone = { bg1: '#33206e', bg2: '#100b22', cx: 0.5, cy: 0.5 };

const TONES: Record<ModuleCoverKey, Tone> = {
  intro: COOL, inbox: COOL, password: COOL, profile: MIXED, photo: WARM,
  wifi: COOL, challenge: WARM, exam: MIXED, prism: MIXED, tunnel: COOL
};

/** Anillos del túnel: rectángulos redondeados que se cierran hacia el centro. */
const TUNNEL = Array.from({ length: 7 }, (_, k) => {
  const f = Math.pow(0.7, k);
  const w = 380 * f;
  const h = 228 * f;
  return { x: 200 - w / 2, y: 120 - h / 2, w, h, r: 26 * f, o: 0.18 + k * 0.1 };
});

/** Rayos del túnel: ángulo (grados), longitud y si son cálidos. */
const RAYS = [
  [-160, 230, 0], [-140, 190, 1], [-118, 160, 0], [-62, 170, 0], [-38, 220, 1],
  [-18, 240, 0], [12, 230, 0], [34, 200, 1], [58, 150, 0], [128, 170, 0], [150, 210, 1], [172, 240, 0]
].map(([deg, len, warm]) => {
  const a = (deg * Math.PI) / 180;
  return {
    x1: 200 + 30 * Math.cos(a), y1: 120 + 30 * Math.sin(a),
    x2: 200 + len * Math.cos(a), y2: 120 + len * Math.sin(a), warm: warm === 1
  };
});

/** Arcos de Wi-Fi centrados en (cx, cy): de -135° a -45°. */
function wifiArcs(cx: number, cy: number, radii: number[]): string[] {
  return radii.map(r => {
    const d = r * Math.SQRT1_2;
    return `M${(cx - d).toFixed(1)} ${(cy - d).toFixed(1)}A${r} ${r} 0 0 1 ${(cx + d).toFixed(1)} ${(cy - d).toFixed(1)}`;
  });
}
const WIFI = wifiArcs(178, 182, [32, 64, 96]);
const WIFI_TWIN = wifiArcs(310, 172, [22, 44]);

let nextId = 0;

/**
 * Portada ilustrada de un módulo: escena de luz y cristal sobre grafito, en índigo y brasa.
 * Catálogo cerrado elegido por el admin (sin subida de imágenes). Sin portada se usa una
 * abstracta escogida por el código del módulo. Rellena su contenedor (recorta, no deforma).
 */
@Component({
  selector: 'ca-module-cover',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" fill="none"
         stroke-linecap="round" stroke-linejoin="round">
      <defs>
        <radialGradient [attr.id]="id('bg')" [attr.cx]="tone().cx" [attr.cy]="tone().cy" r="0.9">
          <stop offset="0" [attr.stop-color]="tone().bg1" />
          <stop offset="0.5" [attr.stop-color]="tone().bg2" />
          <stop offset="1" stop-color="#040406" />
        </radialGradient>
        <linearGradient [attr.id]="id('cool')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.35" stop-color="#aab4ff" />
          <stop offset="1" stop-color="#3647ff" />
        </linearGradient>
        <linearGradient [attr.id]="id('warm')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#fff3e6" />
          <stop offset="0.4" stop-color="#ffa45c" />
          <stop offset="1" stop-color="#ff3d17" />
        </linearGradient>
        <!-- Estelas: se apagan hacia la izquierda (in) o hacia la derecha (out) -->
        <linearGradient [attr.id]="id('in-c')" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#5b6bff" stop-opacity="0" />
          <stop offset="0.7" stop-color="#aab4ff" stop-opacity="0.9" />
          <stop offset="1" stop-color="#ffffff" />
        </linearGradient>
        <linearGradient [attr.id]="id('out-c')" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#ffffff" />
          <stop offset="0.3" stop-color="#aab4ff" stop-opacity="0.9" />
          <stop offset="1" stop-color="#5b6bff" stop-opacity="0" />
        </linearGradient>
        <linearGradient [attr.id]="id('in-w')" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#ff3d17" stop-opacity="0" />
          <stop offset="0.7" stop-color="#ff9a52" stop-opacity="0.9" />
          <stop offset="1" stop-color="#fff1e2" />
        </linearGradient>
        <linearGradient [attr.id]="id('out-w')" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stop-color="#fff1e2" />
          <stop offset="0.3" stop-color="#ff9a52" stop-opacity="0.9" />
          <stop offset="1" stop-color="#ff3d17" stop-opacity="0" />
        </linearGradient>
        <linearGradient [attr.id]="id('glass')" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ffffff" stop-opacity="0.3" />
          <stop offset="0.5" stop-color="#ffffff" stop-opacity="0.05" />
          <stop offset="1" stop-color="#9fb0ff" stop-opacity="0.16" />
        </linearGradient>
        <linearGradient [attr.id]="id('fade')" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0.55" stop-color="#000000" stop-opacity="0" />
          <stop offset="1" stop-color="#000000" stop-opacity="0.45" />
        </linearGradient>
        <filter [attr.id]="id('glow')" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="9" />
        </filter>
        <filter [attr.id]="id('soft')" x="-20%" y="-60%" width="140%" height="220%">
          <feGaussianBlur stdDeviation="2.5" />
        </filter>
        <filter [attr.id]="id('haze')" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="30" />
        </filter>
        <filter [attr.id]="id('grain')" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" stitchTiles="stitch" />
          <feColorMatrix values="0 0 0 0 1  0 0 0 0 1  0 0 0 0 1  0 0 0 0.55 0" />
        </filter>
      </defs>

      <rect width="400" height="240" [attr.fill]="url('bg')" />

      @switch (key()) {
        @case ('intro') {
          <circle cx="200" cy="120" r="64" fill="#5d6cff" opacity="0.45" [attr.filter]="url('haze')" />
          <circle cx="200" cy="120" r="70" fill="#0b1236" stroke="#aab4ff" stroke-opacity="0.7" stroke-width="1.5" />
          <g stroke="#aab4ff" stroke-width="1.2">
            <ellipse cx="200" cy="120" rx="26" ry="70" stroke-opacity="0.4" />
            <ellipse cx="200" cy="120" rx="52" ry="70" stroke-opacity="0.3" />
            <ellipse cx="200" cy="120" rx="70" ry="16" stroke-opacity="0.45" />
            <path d="M144 80H256M144 160H256" stroke-opacity="0.3" />
          </g>
          <circle cx="200" cy="120" r="70" [attr.fill]="url('glass')" />
          <ellipse cx="200" cy="120" rx="128" ry="30" transform="rotate(-16 200 120)"
                   stroke="#ff7a3a" stroke-width="7" opacity="0.7" [attr.filter]="url('glow')" />
          <ellipse cx="200" cy="120" rx="128" ry="30" transform="rotate(-16 200 120)"
                   stroke="#ffd2b0" stroke-width="1.6" />
          <circle cx="318" cy="86" r="10" fill="#ff7a3a" [attr.filter]="url('glow')" />
          <circle cx="318" cy="86" r="4.5" fill="#fff3e6" />
          <circle cx="160" cy="98" r="3" fill="#ffffff" />
          <circle cx="226" cy="146" r="3" fill="#ffffff" />
          <path d="M160 98Q190 80 226 146" stroke="#ffffff" stroke-opacity="0.55" stroke-width="1.2" stroke-dasharray="3 4" />
        }
        @case ('inbox') {
          <ellipse cx="200" cy="120" rx="130" ry="64" fill="#4a5cff" opacity="0.4" [attr.filter]="url('haze')" />
          <rect x="0" y="94" width="150" height="3" rx="1.5" [attr.fill]="url('in-c')" [attr.filter]="url('soft')" />
          <rect x="20" y="134" width="130" height="2" rx="1" [attr.fill]="url('in-c')" />
          <rect x="260" y="104" width="140" height="4" rx="2" [attr.fill]="url('out-c')" [attr.filter]="url('soft')" />
          <rect x="262" y="146" width="120" height="2" rx="1" [attr.fill]="url('out-w')" />
          <rect x="140" y="72" width="120" height="86" rx="12" [attr.fill]="url('glass')"
                stroke="#c9d0ff" stroke-opacity="0.75" stroke-width="1.5" />
          <path d="M148 82L200 124L252 82" stroke="#7b8aff" stroke-width="8" opacity="0.8" [attr.filter]="url('glow')" />
          <path d="M148 82L200 124L252 82" stroke="#eef0ff" stroke-width="2" />
          <path d="M232 -6V112A16 16 0 0 1 200 112V104M200 104L193 112" stroke="#ff6a2a" stroke-width="10"
                opacity="0.85" [attr.filter]="url('glow')" />
          <path d="M232 -6V112A16 16 0 0 1 200 112V104M200 104L193 112" stroke="#ffe2c8" stroke-width="2.6" />
        }
        @case ('password') {
          <ellipse cx="200" cy="130" rx="110" ry="70" fill="#4a5cff" opacity="0.4" [attr.filter]="url('haze')" />
          <path d="M168 104V82A32 32 0 0 1 232 82V104" stroke="#7b8aff" stroke-width="16" opacity="0.6" [attr.filter]="url('glow')" />
          <path d="M168 104V82A32 32 0 0 1 232 82V104" stroke="#dfe3ff" stroke-width="7" />
          <rect x="146" y="100" width="108" height="84" rx="16" [attr.fill]="url('glass')"
                stroke="#c9d0ff" stroke-opacity="0.75" stroke-width="1.5" />
          <path d="M200 140L120 240H280Z" fill="#ff7a3a" opacity="0.25" [attr.filter]="url('glow')" />
          <circle cx="200" cy="136" r="16" fill="#ff6a2a" opacity="0.9" [attr.filter]="url('glow')" />
          <circle cx="200" cy="134" r="8" fill="#fff1e2" />
          <rect x="196" y="138" width="8" height="22" rx="4" fill="#fff1e2" />
          @for (x of [128, 164, 200, 236, 272]; track x) {
            <circle [attr.cx]="x" cy="214" r="8" fill="#8f97ff" [attr.filter]="url('glow')" />
            <circle [attr.cx]="x" cy="214" r="4.5" fill="#ffffff" />
          }
        }
        @case ('profile') {
          <ellipse cx="190" cy="120" rx="120" ry="70" fill="#7a5cff" opacity="0.35" [attr.filter]="url('haze')" />
          <rect x="112" y="50" width="150" height="140" rx="14" [attr.fill]="url('glass')"
                stroke="#c9d0ff" stroke-opacity="0.7" stroke-width="1.5" />
          <circle cx="152" cy="92" r="18" fill="#8f97ff" opacity="0.5" [attr.filter]="url('glow')" />
          <circle cx="152" cy="92" r="17" stroke="#e6e9ff" stroke-width="1.6" />
          <path d="M141 103A11 11 0 0 1 163 103M146 88A6 6 0 1 0 158 88A6 6 0 1 0 146 88" stroke="#e6e9ff" stroke-width="1.6" />
          <rect x="180" y="82" width="62" height="7" rx="3.5" fill="#ffffff" opacity="0.6" />
          <rect x="180" y="98" width="42" height="6" rx="3" fill="#ffffff" opacity="0.3" />
          <rect x="130" y="130" width="114" height="6" rx="3" fill="#ffffff" opacity="0.25" />
          <rect x="130" y="146" width="88" height="6" rx="3" fill="#ffffff" opacity="0.2" />
          <rect x="130" y="162" width="100" height="6" rx="3" fill="#ffffff" opacity="0.15" />
          <g stroke-width="1.4">
            <path d="M276 64L312 52L300 92Z" [attr.fill]="url('glass')" stroke="#c9d0ff" stroke-opacity="0.6" />
            <path d="M290 112L342 96L326 140Z" [attr.fill]="url('glass')" stroke="#ffb58a" stroke-opacity="0.8" />
            <path d="M282 156L322 170L292 184Z" [attr.fill]="url('glass')" stroke="#c9d0ff" stroke-opacity="0.5" />
            <path d="M344 60L360 72L346 80Z" [attr.fill]="url('glass')" stroke="#c9d0ff" stroke-opacity="0.4" />
          </g>
          <g transform="rotate(-12 200 120)">
            <rect x="-20" y="116" width="440" height="8" fill="#ff6a2a" opacity="0.7" [attr.filter]="url('glow')" />
            <rect x="-20" y="119" width="440" height="2" [attr.fill]="url('out-w')" />
          </g>
        }
        @case ('photo') {
          <ellipse cx="220" cy="110" rx="130" ry="70" fill="#ff6a2a" opacity="0.3" [attr.filter]="url('haze')" />
          <path d="M96 64V44H116M284 44H304V64M304 176V196H284M116 196H96V176" stroke="#ffffff" stroke-opacity="0.7" stroke-width="2" />
          <rect x="112" y="58" width="176" height="124" rx="12" [attr.fill]="url('glass')"
                stroke="#ffffff" stroke-opacity="0.45" stroke-width="1.4" />
          <path d="M122 172L168 118L196 146L222 122L278 172Z" [attr.fill]="url('cool')" opacity="0.55" />
          <circle cx="246" cy="90" r="12" fill="#ff8a4c" [attr.filter]="url('glow')" />
          <circle cx="246" cy="90" r="7" fill="#fff1e2" />
          @for (y of [70, 84, 98, 112]; track y) {
            <rect x="22" [attr.y]="y" [attr.width]="y === 84 ? 40 : 56" height="4" rx="2" fill="#ffffff" opacity="0.22" />
          }
          <ellipse cx="312" cy="110" rx="46" ry="12" stroke="#ff8a4c" stroke-opacity="0.35" stroke-width="1.4" />
          <ellipse cx="312" cy="110" rx="26" ry="7" stroke="#ff8a4c" stroke-opacity="0.7" stroke-width="1.4" />
          <path d="M312 108C298 90 292 82 292 72A20 20 0 1 1 332 72C332 82 326 90 312 108Z" fill="#ff5a1f" opacity="0.9" [attr.filter]="url('glow')" />
          <path d="M312 108C298 90 292 82 292 72A20 20 0 1 1 332 72C332 82 326 90 312 108Z" [attr.fill]="url('warm')" />
          <circle cx="312" cy="71" r="7" fill="#1c0a06" />
        }
        @case ('wifi') {
          <ellipse cx="190" cy="150" rx="120" ry="60" fill="#4a5cff" opacity="0.4" [attr.filter]="url('haze')" />
          @for (d of wifi; track $index) {
            <path [attr.d]="d" stroke="#7b8aff" stroke-width="14" opacity="0.6" [attr.filter]="url('glow')" />
            <path [attr.d]="d" stroke="#e6e9ff" stroke-width="5" />
          }
          <circle cx="178" cy="182" r="9" fill="#ffffff" />
          @for (d of wifiTwin; track $index) {
            <path [attr.d]="d" stroke="#ff6a2a" stroke-width="10" opacity="0.6" [attr.filter]="url('glow')" />
            <path [attr.d]="d" stroke="#ffd2b0" stroke-width="3" stroke-dasharray="6 5" />
          }
          <circle cx="310" cy="172" r="6" fill="#ffd2b0" />
          <g transform="skewX(-20)">
            <rect x="40" y="206" width="300" height="5" rx="2.5" [attr.fill]="url('in-c')" [attr.filter]="url('soft')" />
            <rect x="160" y="216" width="300" height="3" rx="1.5" [attr.fill]="url('in-w')" />
            <rect x="0" y="226" width="260" height="2" rx="1" [attr.fill]="url('in-c')" opacity="0.6" />
          </g>
        }
        @case ('challenge') {
          <ellipse cx="200" cy="118" rx="110" ry="80" fill="#ff5a1f" opacity="0.3" [attr.filter]="url('haze')" />
          @for (a of attacks; track $index) {
            <path [attr.d]="a" stroke="#ff6a2a" stroke-width="7" opacity="0.7" [attr.filter]="url('glow')" />
            <path [attr.d]="a" stroke="#ffd9bd" stroke-width="1.8" />
          }
          <path d="M200 38L258 60V110C258 150 234 176 200 194C166 176 142 150 142 110V60Z"
                stroke="#7b8aff" stroke-width="14" opacity="0.65" [attr.filter]="url('glow')" />
          <path d="M200 38L258 60V110C258 150 234 176 200 194C166 176 142 150 142 110V60Z"
                [attr.fill]="url('glass')" stroke="#e6e9ff" stroke-width="2" />
          <path d="M178 116L194 132L224 100" stroke="#ffffff" stroke-width="6" />
          @for (p of impacts; track $index) {
            <circle [attr.cx]="p[0]" [attr.cy]="p[1]" r="9" fill="#ff7a3a" [attr.filter]="url('glow')" />
            <circle [attr.cx]="p[0]" [attr.cy]="p[1]" r="3.5" fill="#fff3e6" />
          }
        }
        @case ('exam') {
          <ellipse cx="220" cy="130" rx="130" ry="70" fill="#6b5cff" opacity="0.35" [attr.filter]="url('haze')" />
          @for (b of bars; track b.x; let last = $last) {
            <rect [attr.x]="b.x" [attr.y]="196 - b.h" width="26" [attr.height]="b.h" rx="6"
                  [attr.fill]="url(last ? 'warm' : 'cool')" [attr.opacity]="last ? 0.95 : 0.35 + b.h / 260" />
            <rect [attr.x]="b.x" y="200" width="26" [attr.height]="b.h / 4" rx="6"
                  [attr.fill]="url(last ? 'warm' : 'cool')" opacity="0.1" />
          }
          <path d="M125 150L163 126L201 102L239 78L277 54" stroke="#aab4ff" stroke-width="8" opacity="0.7" [attr.filter]="url('glow')" />
          <path d="M125 150L163 126L201 102L239 78L277 54" stroke="#ffffff" stroke-width="2.2" />
          <circle cx="277" cy="54" r="14" fill="#ff7a3a" [attr.filter]="url('glow')" />
          <path d="M277 43L280.5 50.5L288.5 51.5L282.5 57L284 65L277 61L270 65L271.5 57L265.5 51.5L273.5 50.5Z" fill="#fff3e6" />
        }
        @case ('prism') {
          <ellipse cx="220" cy="120" rx="140" ry="70" fill="#6b5cff" opacity="0.35" [attr.filter]="url('haze')" />
          <path d="M0 126L176 116V124L0 134Z" fill="#ffffff" opacity="0.7" [attr.filter]="url('soft')" />
          <path d="M0 128L176 119V121L0 132Z" fill="#ffffff" />
          <path d="M228 112L400 50V94Z" fill="#5b6bff" opacity="0.8" [attr.filter]="url('glow')" />
          <path d="M228 112L400 58V88Z" [attr.fill]="url('out-c')" opacity="0.9" />
          <path d="M230 118L400 104V134Z" fill="#c6b5ff" opacity="0.6" [attr.filter]="url('glow')" />
          <path d="M232 126L400 150V198Z" fill="#ff5a1f" opacity="0.8" [attr.filter]="url('glow')" />
          <path d="M232 126L400 158V190Z" [attr.fill]="url('out-w')" opacity="0.9" />
          <path d="M200 46L264 174H136Z" [attr.fill]="url('glass')" stroke="#ffffff" stroke-opacity="0.65" stroke-width="1.6" />
          <path d="M200 46L214 174" stroke="#ffffff" stroke-opacity="0.25" stroke-width="1.2" />
        }
        @default {
          <circle cx="200" cy="120" r="80" fill="#4a5cff" opacity="0.45" [attr.filter]="url('haze')" />
          @for (r of tunnel; track $index) {
            <rect [attr.x]="r.x" [attr.y]="r.y" [attr.width]="r.w" [attr.height]="r.h" [attr.rx]="r.r"
                  stroke="#aab4ff" [attr.stroke-opacity]="r.o" stroke-width="1.3" />
          }
          @for (ray of rays; track $index) {
            <line [attr.x1]="ray.x1" [attr.y1]="ray.y1" [attr.x2]="ray.x2" [attr.y2]="ray.y2"
                  [attr.stroke]="ray.warm ? '#ff8a4c' : '#aab4ff'" stroke-width="2.4" opacity="0.75" [attr.filter]="url('soft')" />
          }
          <circle cx="200" cy="120" r="26" fill="#ffffff" opacity="0.8" [attr.filter]="url('glow')" />
          <circle cx="200" cy="120" r="9" fill="#ffffff" />
        }
      }

      <rect width="400" height="240" [attr.filter]="url('grain')" opacity="0.07" />
      <rect width="400" height="240" [attr.fill]="url('fade')" />
    </svg>
  `,
  styles: `
    :host {
      display: block;
      overflow: hidden;
      background: #050508;
    }
    svg {
      display: block;
      width: 100%;
      height: 100%;
    }
  `
})
export class ModuleCoverComponent {
  /** Clave del catálogo; null = abstracta escogida por la semilla. */
  cover = input<string | null | undefined>(null);
  /** Código del módulo: decide la portada abstracta para que no todas sean iguales. */
  seed = input('');

  private readonly gid = `cover-${nextId++}`;

  protected readonly wifi = WIFI;
  protected readonly wifiTwin = WIFI_TWIN;
  protected readonly tunnel = TUNNEL;
  protected readonly rays = RAYS;
  protected readonly bars = [40, 64, 88, 112, 136].map((h, i) => ({ x: 112 + i * 38, h }));
  protected readonly attacks = ['M-10 52L136 98', 'M-10 168L140 134', 'M410 62L264 96', 'M410 200L254 150'];
  protected readonly impacts = [[136, 98], [140, 134], [264, 96], [254, 150]];

  protected key = computed<ModuleCoverKey>(() => {
    const cover = this.cover();
    if (cover && MODULE_COVERS.some(c => c.key === cover)) return cover as ModuleCoverKey;
    let hash = 0;
    for (const ch of this.seed()) hash = (hash * 31 + ch.charCodeAt(0)) | 0;
    return Math.abs(hash) % 2 === 0 ? 'prism' : 'tunnel';
  });

  protected tone = computed(() => TONES[this.key()]);

  protected id(name: string): string {
    return `${this.gid}-${name}`;
  }

  protected url(name: string): string {
    return `url(#${this.gid}-${name})`;
  }
}
