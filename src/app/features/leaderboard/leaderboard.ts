import { ChangeDetectionStrategy, Component, OnInit, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { ProfileService } from '../../core/services/profile';
import { Leaderboard, LeaderboardPeriod, LeagueCode } from '../../core/models/profile.model';
import { AppHeaderComponent } from '../../shared/ui/app-header';
import { AvatarComponent } from '../../shared/ui/avatar';
import { LeagueEmblemComponent } from '../../shared/ui/league-emblem';
import { IconComponent } from '../../shared/ui/icon';

/** Umbrales de cada liga. Deben coincidir con League.java del backend. */
const LEAGUES: { code: LeagueCode; name: string; minXp: number }[] = [
  { code: 'RECLUTA', name: 'Recluta', minXp: 0 },
  { code: 'ANALISTA', name: 'Analista', minXp: 150 },
  { code: 'DEFENSOR', name: 'Defensor', minXp: 450 },
  { code: 'CENTINELA', name: 'Centinela', minXp: 900 },
  { code: 'ELITE', name: 'Élite', minXp: 1500 }
];

@Component({
  selector: 'app-leaderboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, AppHeaderComponent, AvatarComponent, LeagueEmblemComponent, IconComponent],
  templateUrl: './leaderboard.html',
  styleUrl: './leaderboard.css'
})
export class LeaderboardComponent implements OnInit {
  private profileService = inject(ProfileService);

  protected readonly leagues = LEAGUES;
  protected readonly profile = this.profileService.profile;

  period = signal<LeaderboardPeriod>('week');
  board = signal<Leaderboard | null>(null);
  loading = signal(true);
  error = signal<string | null>(null);

  ngOnInit(): void {
    this.load();
  }

  setPeriod(period: LeaderboardPeriod): void {
    if (period === this.period()) return;
    this.period.set(period);
    this.load();
  }

  load(): void {
    const period = this.period();
    this.loading.set(true);
    this.error.set(null);
    this.profileService.getLeaderboard(period).subscribe({
      next: res => {
        // Si el usuario cambió de pestaña mientras cargaba, se ignora la respuesta vieja
        if (period !== this.period()) return;
        this.board.set(res.data ?? null);
        this.loading.set(false);
      },
      error: err => {
        if (period !== this.period()) return;
        this.loading.set(false);
        this.error.set(err?.status === 0
          ? 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.'
          : err?.error?.message || 'No se pudo cargar la clasificación.');
      }
    });
  }

  tierColor(code: LeagueCode): string {
    return `var(--ca-tier-${code.toLowerCase()})`;
  }
}
