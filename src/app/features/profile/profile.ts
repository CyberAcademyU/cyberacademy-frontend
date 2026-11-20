import { ChangeDetectionStrategy, Component, OnInit, computed, inject, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { GoogleButtonComponent } from '../auth/google-button';
import { ProfileService } from '../../core/services/profile';
import { Badge } from '../../core/models/profile.model';
import { AppHeaderComponent } from '../../shared/ui/app-header';
import { AvatarComponent } from '../../shared/ui/avatar';
import { LeagueEmblemComponent } from '../../shared/ui/league-emblem';
import { BadgeMedalComponent } from '../../shared/ui/badge-medal';
import { ActivityHeatmapComponent } from '../../shared/ui/activity-heatmap';
import { IconComponent } from '../../shared/ui/icon';
import { ProfileEditDialogComponent } from './profile-edit-dialog';
import { PasswordFormComponent } from './password-form';
import { ProfilePictureComponent } from './profile-picture';
import { transientMessage } from '../../shared/ui/transient-message';

interface ChecklistItem {
  label: string;
  done: boolean;
}

@Component({
  selector: 'app-profile',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    RouterLink,
    GoogleButtonComponent,
    AppHeaderComponent,
    AvatarComponent,
    LeagueEmblemComponent,
    BadgeMedalComponent,
    ActivityHeatmapComponent,
    IconComponent,
    ProfileEditDialogComponent,
    PasswordFormComponent,
    ProfilePictureComponent
  ],
  host: { '(document:keydown.escape)': 'editing.set(false)', '[class.is-embedded]': 'embedded()' },
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class ProfileComponent implements OnInit {
  readonly embedded = input(false);
  private profileService = inject(ProfileService);

  profile = this.profileService.profile;
  loading = signal(true);
  error = signal<string | null>(null);
  editing = signal(false);
  notice = transientMessage<string | null>(null);
  private googleLinkConfirmation = signal(false);

  showGoogleLink = computed(() => {
    const p = this.profile();
    return !!p && (!p.googleLinked || this.googleLinkConfirmation()) && p.email.toLowerCase().endsWith('@gmail.com');
  });

  memberSince = computed(() => {
    const p = this.profile();
    return p ? new Date(p.createdAt).toLocaleDateString('es', { month: 'long', year: 'numeric' }) : '';
  });

  checklist = computed<ChecklistItem[]>(() => {
    const p = this.profile();
    if (!p) return [];
    const identityItems = [
      { label: 'Elige un avatar o foto', done: !!p.avatar || !!p.photoUrl },
      { label: 'Elige tu alias público', done: !!p.displayName },
      { label: 'Escribe tu biografía', done: !!p.bio },
    ];
    if (p.role === 'ADMIN') return identityItems;
    return [
      ...identityItems,
      { label: 'Aprueba tu primer módulo', done: p.modulesCompleted > 0 },
      { label: 'Consigue tu primera insignia', done: p.badges.some(b => b.earned) }
    ];
  });

  completion = computed(() => {
    const items = this.checklist();
    return items.length ? Math.round((items.filter(i => i.done).length / items.length) * 100) : 0;
  });

  earnedCount = computed(() => this.profile()?.badges.filter(b => b.earned).length ?? 0);
  activityTotal = computed(() => this.profile()?.activity.reduce((sum, d) => sum + d.count, 0) ?? 0);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.profileService.load().subscribe({
      next: () => this.loading.set(false),
      error: err => {
        this.loading.set(false);
        this.error.set(err?.status === 0
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
          : err?.error?.message || 'No se pudo cargar tu perfil.');
      }
    });
  }

  onSaved(): void {
    this.editing.set(false);
    this.notice.set('Perfil actualizado.');
  }

  onGoogleLinked(): void {
    this.googleLinkConfirmation.set(false);
  }

  onGoogleLinkSucceeded(): void {
    this.googleLinkConfirmation.set(true);
    // La respuesta de vinculación ya ha sido validada por el servidor.
    // Actualizar el perfil compartido sin recargar la página.
    this.profile.update(p => p ? { ...p, googleLinked: true } : p);
  }

  badgeStatus(badge: Badge): string {
    if (badge.earned) {
      return badge.earnedAt
        ? 'Conseguida el ' + new Date(badge.earnedAt).toLocaleDateString('es', { day: 'numeric', month: 'long', year: 'numeric' })
        : 'Conseguida';
    }
    return badge.target > 1 ? `${badge.current} de ${badge.target}` : 'Bloqueada';
  }

  tierColor(code: string): string {
    return `var(--ca-tier-${code.toLowerCase()})`;
  }
}
