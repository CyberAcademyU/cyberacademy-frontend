import { ChangeDetectionStrategy, Component, input } from '@angular/core';

export type IconName =
  | 'check'
  | 'lock'
  | 'close'
  | 'logout'
  | 'download'
  | 'plus'
  | 'overview'
  | 'modules'
  | 'users'
  | 'chart'
  | 'mail'
  | 'arrow-left'
  | 'arrow-right'
  | 'play'
  | 'alert'
  | 'trash'
  | 'edit'
  | 'book'
  | 'history'
  | 'bookmark'
  | 'bookmark-filled'
  | 'trophy'
  | 'user'
  | 'flame'
  | 'key'
  | 'eye'
  | 'eye-off'
  | 'pin';

/** Iconos de trazo en SVG en línea: sin peticiones externas y heredan el color del texto. */
@Component({
  selector: 'ca-icon',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { 'aria-hidden': 'true', style: 'display:inline-flex' },
  template: `
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"
         stroke-linecap="round" stroke-linejoin="round" [attr.width]="size()" [attr.height]="size()">
      @switch (name()) {
        @case ('check') { <path d="M5 12.5l4.5 4.5L19 7.5" /> }
        @case ('lock') { <rect x="5" y="10.5" width="14" height="10" rx="1.5" /><path d="M8 10.5V7.5a4 4 0 0 1 8 0v3" /> }
        @case ('close') { <path d="M6 6l12 12M18 6L6 18" /> }
        @case ('logout') { <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M10 16l-4-4 4-4M6 12h10" /> }
        @case ('download') { <path d="M12 4v11M7.5 10.5L12 15l4.5-4.5M5 19h14" /> }
        @case ('plus') { <path d="M12 5v14M5 12h14" /> }
        @case ('overview') { <path d="M4 13h6V4H4zM14 20h6v-9h-6zM14 4h6v3h-6zM4 20h6v-3H4z" /> }
        @case ('modules') { <path d="M12 3l8 4.5v9L12 21l-8-4.5v-9z" /><path d="M12 12l8-4.5M12 12v9M12 12L4 7.5" /> }
        @case ('users') { <circle cx="9" cy="8" r="3.5" /><path d="M3 20c.5-3.5 3-5.5 6-5.5s5.5 2 6 5.5M16 4.5a3.5 3.5 0 0 1 0 7M18 14.8c1.7.7 2.7 2.4 3 5.2" /> }
        @case ('chart') { <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> }
        @case ('mail') { <rect x="3" y="5" width="18" height="14" rx="1.5" /><path d="M3.5 6l8.5 7 8.5-7" /> }
        @case ('arrow-left') { <path d="M19 12H5M11 6l-6 6 6 6" /> }
        @case ('arrow-right') { <path d="M5 12h14M13 6l6 6-6 6" /> }
        @case ('play') { <path d="M8 5.5v13l10-6.5z" /> }
        @case ('alert') { <path d="M12 3l9.5 17h-19z" /><path d="M12 10v4M12 17.5v.01" /> }
        @case ('trash') { <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" /> }
        @case ('edit') { <path d="M4 20h4L19 9l-4-4L4 16z" /><path d="M13.5 6.5l4 4" /> }
        @case ('book') { <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5c-3.5-.5-6.5 0-8.5 1.5zM12 6.5v13" /> }
        @case ('history') { <path d="M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5" /><path d="M3.5 4v4.5H8M12 8v4.5l3 2" /> }
        @case ('bookmark') { <path d="M6.5 3.5h11v17L12 16l-5.5 4.5z" /> }
        @case ('bookmark-filled') { <path d="M6.5 3.5h11v17L12 16l-5.5 4.5z" fill="currentColor" /> }
        @case ('trophy') { <path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5c0 3 1.5 4.5 3.7 4.8M16 6h3.5c0 3-1.5 4.5-3.7 4.8M12 13v4M8.5 20h7M10 17h4v3h-4z" /> }
        @case ('user') { <circle cx="12" cy="8" r="4" /><path d="M4 20.5c.8-4 4-6.5 8-6.5s7.2 2.5 8 6.5" /> }
        @case ('flame') { <path d="M12 21c-4 0-7-2.6-7-6.5 0-3.4 2.5-5.4 3.5-8.5 1.5 1.3 2.3 2.7 2.5 4.2C12.5 8.5 13.5 6 13 3c3.7 2.4 6 6.3 6 11.5 0 3.9-3 6.5-7 6.5z" /><path d="M12 21c-1.7 0-3-1.2-3-3 0-1.6 1.2-2.6 1.8-4 .9.8 1.5 1.6 1.7 2.6.6-.6 1-1.4 1-2.4 1.3 1.1 2.5 2.4 2.5 3.8 0 1.8-1.6 3-4 3z" /> }
        @case ('key') { <circle cx="8" cy="15" r="4.5" /><path d="M11.2 11.8L20 3M16.5 6.5l3 3M14 9l2 2" /> }
        @case ('eye') { <path d="M2.5 12c1-2.5 4.5-7 9.5-7s8.5 4.5 9.5 7c-1 2.5-4.5 7-9.5 7s-8.5-4.5-9.5-7z" /><circle cx="12" cy="12" r="3" /> }
        @case ('eye-off') { <path d="M3 3l18 18M10.6 5.2c.5-.1.9-.2 1.4-.2 5 0 8.5 4.5 9.5 7-.4 1-1.2 2.3-2.4 3.6M6.4 6.6C4.4 8 3.1 10 2.5 12c1 2.5 4.5 7 9.5 7 1.9 0 3.6-.6 5-1.6M9.9 9.9a3 3 0 0 0 4.2 4.2" /> }
        @case ('pin') { <path d="M12 21s-6.5-5.6-6.5-11a6.5 6.5 0 0 1 13 0c0 5.4-6.5 11-6.5 11z" /><circle cx="12" cy="10" r="2.3" /> }
      }
    </svg>
  `
})
export class IconComponent {
  name = input.required<IconName>();
  size = input(20);
}
