export type LeagueCode = 'RECLUTA' | 'ANALISTA' | 'DEFENSOR' | 'CENTINELA' | 'ELITE';

export type BadgeCode =
  | 'PRIMER_PASO'
  | 'PRIMER_MODULO'
  | 'SIN_ERRORES'
  | 'RACHA_3'
  | 'CINCO_MODULOS'
  | 'TEMARIO_COMPLETO'
  | 'IDENTIDAD';

export interface League {
  code: LeagueCode;
  name: string;
  minXp: number;
  nextCode: LeagueCode | null;
  nextName: string | null;
  nextMinXp: number | null;
}

export interface Badge {
  code: BadgeCode;
  name: string;
  description: string;
  earned: boolean;
  earnedAt: string | null;
  current: number;
  target: number;
}

export interface ActivityDay {
  date: string; // yyyy-MM-dd
  count: number;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'STUDENT' | 'ADMIN';
  displayName: string | null;
  publicName: string;
  bio: string | null;
  country: string | null;
  avatar: string | null;
  showInLeaderboard: boolean;
  createdAt: string;
  xp: number;
  league: League;
  rank: number | null;
  totalRanked: number;
  modulesCompleted: number;
  modulesTotal: number;
  averageScore: number | null;
  currentStreak: number;
  longestStreak: number;
  badges: Badge[];
  activity: ActivityDay[];
}

export interface UpdateProfileRequest {
  firstName: string;
  lastName: string;
  displayName: string;
  bio: string;
  country: string;
  avatar: string;
  showInLeaderboard: boolean;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export type LeaderboardPeriod = 'week' | 'all';

export interface LeaderboardEntry {
  rank: number | null;
  name: string;
  avatar: string | null;
  xp: number;
  modulesCompleted: number;
  league: League;
  me: boolean;
}

export interface Leaderboard {
  period: 'WEEK' | 'ALL';
  entries: LeaderboardEntry[];
  me: LeaderboardEntry | null;
  totalRanked: number;
  hidden: boolean;
}
