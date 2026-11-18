import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'ca-rocu-avatar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true' },
  template: `
    <svg viewBox="0 0 80 80" fill="none">
      <circle cx="40" cy="40" r="36" stroke="currentColor" stroke-width="1.4" opacity=".5" />
      <circle cx="40" cy="40" r="32.5" stroke="currentColor" stroke-width="2" stroke-dasharray="17 4 6 4" />
      <path d="M26 28v-6m28 6v-6M26 22l-3-4m31 4 3-4" stroke="currentColor" stroke-width="2" stroke-linecap="round" />
      <circle cx="22" cy="16" r="3" stroke="currentColor" stroke-width="1.6" />
      <circle cx="58" cy="16" r="3" stroke="currentColor" stroke-width="1.6" />
      <path d="M20 43a20 20 0 0 1 40 0" stroke="currentColor" stroke-width="3" />
      <rect x="17" y="40" width="7" height="15" rx="3.5" fill="currentColor" />
      <rect x="56" y="40" width="7" height="15" rx="3.5" fill="currentColor" />
      <rect x="24" y="32" width="32" height="27" rx="12" fill="currentColor" />
      <rect x="28" y="39" width="24" height="13" rx="6.5" fill="var(--rocu-face, #111116)" />
      <circle cx="35" cy="45.5" r="1.8" fill="currentColor" />
      <circle cx="45" cy="45.5" r="1.8" fill="currentColor" />
      <path d="M37.5 50c1.5 1.4 3.5 1.4 5 0M19 54c0 5 5 7 12 7" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" />
      <circle cx="32" cy="61" r="1.8" fill="currentColor" />
    </svg>
  `,
  styles: `:host { display: inline-flex; flex: none; } svg { display: block; width: 100%; height: 100%; }`,
})
export class RocuAvatarComponent {}
