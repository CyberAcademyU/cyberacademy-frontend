import { ProgressStatus } from './course-module.model';
import { UserStatus } from './user.model';

export interface StudentOverview {
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  status: UserStatus;
  modulesCompleted: number;
  modulesTotal: number;
  averageScore: number | null;
  progressPercent: number;
  lastActivityAt: string | null;
  createdAt: string;
}

export interface ModuleCompletion {
  moduleId: string;
  code: string;
  title: string;
  orderIndex: number;
  completedStudents: number;
  inProgressStudents: number;
  failedStudents: number;
  startedStudents: number;
  completionPercent: number;
}

export interface RecentActivity {
  studentName: string;
  moduleCode: string;
  moduleTitle: string;
  sectionTitle: string;
  score: number | null;
  status: ProgressStatus;
  occurredAt: string;
}

export interface AdminOverview {
  totalStudents: number;
  activeStudents: number;
  studentsCompletedAll: number;
  averageScore: number | null;
  averageProgress: number;
  totalActiveModules: number;
  modules: ModuleCompletion[];
  recentActivity: RecentActivity[];
}
