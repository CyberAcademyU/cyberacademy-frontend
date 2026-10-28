import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ModulesService } from '../../../core/services/modules';
import { AdminDashboardService } from '../../../core/services/admin-dashboard';
import { CourseModuleResponse, ModuleSummary, ProgressStatus } from '../../../core/models/course-module.model';
import { AdminOverview, StudentOverview } from '../../../core/models/admin-dashboard.model';
import { UserStatus } from '../../../core/models/user.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminDashboardComponent implements OnInit {
  private authService = inject(AuthService);
  private modulesService = inject(ModulesService);
  private adminDashboardService = inject(AdminDashboardService);
  private router = inject(Router);

  user = this.authService.currentUserSignal;
  activeTab = signal<'resumen' | 'modulos' | 'usuarios'>('resumen');
  exportSuccess = signal(false);

  // --- Resumen global (datos reales) ---
  overview = signal<AdminOverview | null>(null);
  overviewLoading = signal(true);
  overviewError = signal<string | null>(null);

  // --- Estudiantes (datos reales) ---
  students = signal<StudentOverview[]>([]);
  studentsLoading = signal(true);
  studentsError = signal<string | null>(null);

  // --- Detalle del progreso de un estudiante ---
  selectedStudent = signal<StudentOverview | null>(null);
  studentProgress = signal<ModuleSummary[] | null>(null);
  studentProgressLoading = signal(false);
  studentProgressError = signal<string | null>(null);

  // --- Gestión de módulos ---
  realModules = signal<CourseModuleResponse[]>([]);
  modulesLoading = signal(false);
  modulesError = signal<string | null>(null);
  modulesMessage = signal<string | null>(null);

  showCreateForm = signal(false);
  creating = signal(false);
  createError = signal<string | null>(null);
  newModule = { code: '', title: '', description: '', orderIndex: 1, passingScore: 70 };

  weightDrafts = signal<Record<string, Record<string, number>>>({});
  savingWeights = signal<string | null>(null);

  completionRate = computed(() => {
    const data = this.overview();
    if (!data || data.totalStudents === 0) return 0;
    return Math.round((data.studentsCompletedAll / data.totalStudents) * 100);
  });

  ngOnInit(): void {
    this.loadOverview();
    this.loadStudents();
    this.loadModules();
  }

  selectTab(tab: 'resumen' | 'modulos' | 'usuarios'): void {
    this.activeTab.set(tab);
    if (tab === 'resumen') {
      this.loadOverview();
    } else if (tab === 'modulos') {
      this.loadModules();
    } else {
      this.loadStudents();
    }
  }

  // =========================================================================
  // Resumen
  // =========================================================================

  loadOverview(): void {
    this.overviewLoading.set(true);
    this.overviewError.set(null);

    this.adminDashboardService.getOverview().subscribe({
      next: (res) => {
        this.overview.set(res.data ?? null);
        this.overviewLoading.set(false);
      },
      error: (err) => {
        this.overviewLoading.set(false);
        this.overviewError.set(this.readError(err, 'No se pudo cargar el resumen.'));
      }
    });
  }

  // =========================================================================
  // Estudiantes
  // =========================================================================

  loadStudents(): void {
    this.studentsLoading.set(true);
    this.studentsError.set(null);

    this.adminDashboardService.getStudents().subscribe({
      next: (res) => {
        this.students.set(res.data ?? []);
        this.studentsLoading.set(false);
      },
      error: (err) => {
        this.studentsLoading.set(false);
        this.studentsError.set(this.readError(err, 'No se pudieron cargar los estudiantes.'));
      }
    });
  }

  openStudentDetail(student: StudentOverview): void {
    this.selectedStudent.set(student);
    this.studentProgress.set(null);
    this.studentProgressError.set(null);
    this.studentProgressLoading.set(true);

    this.modulesService.getStudentProgress(student.userId).subscribe({
      next: (res) => {
        this.studentProgress.set(res.data ?? []);
        this.studentProgressLoading.set(false);
      },
      error: (err) => {
        this.studentProgressLoading.set(false);
        this.studentProgressError.set(this.readError(err, 'No se pudo cargar el progreso del estudiante.'));
      }
    });
  }

  closeStudentDetail(): void {
    this.selectedStudent.set(null);
    this.studentProgress.set(null);
    this.studentProgressError.set(null);
  }

  // =========================================================================
  // Gestión de módulos
  // =========================================================================

  loadModules(): void {
    this.modulesLoading.set(true);
    this.modulesError.set(null);

    this.modulesService.getModules(true).subscribe({
      next: (res) => {
        const list = res.data ?? [];
        this.realModules.set(list);
        this.weightDrafts.set(this.buildWeightDrafts(list));
        this.modulesLoading.set(false);
      },
      error: (err) => {
        this.modulesLoading.set(false);
        this.modulesError.set(this.readError(err, 'No se pudieron cargar los módulos.'));
      }
    });
  }

  openCreateForm(): void {
    this.showCreateForm.set(true);
    this.createError.set(null);
    this.modulesMessage.set(null);
  }

  cancelCreateForm(): void {
    this.showCreateForm.set(false);
    this.createError.set(null);
  }

  createModule(): void {
    const code = this.newModule.code.trim();
    const title = this.newModule.title.trim();

    if (!code || !title) {
      this.createError.set('El código y el título son obligatorios.');
      return;
    }

    this.creating.set(true);
    this.createError.set(null);

    this.modulesService
      .createModule({
        code,
        title,
        description: this.newModule.description.trim() || undefined,
        orderIndex: Number(this.newModule.orderIndex) || 1,
        passingScore: Number(this.newModule.passingScore)
      })
      .subscribe({
        next: (res) => {
          this.creating.set(false);
          this.showCreateForm.set(false);
          this.newModule = { code: '', title: '', description: '', orderIndex: 1, passingScore: 70 };
          this.loadModules();
          this.loadOverview();
          this.modulesMessage.set(`Módulo ${res.data?.code ?? code} creado con sus 4 secciones.`);
        },
        error: (err) => {
          this.creating.set(false);
          this.createError.set(this.readError(err, 'No se pudo crear el módulo.'));
        }
      });
  }

  weightFor(moduleId: string, sectionId: string): number {
    return this.weightDrafts()[moduleId]?.[sectionId] ?? 0;
  }

  setWeight(moduleId: string, sectionId: string, value: number | string): void {
    const weight = Number(value);
    this.weightDrafts.update((drafts) => ({
      ...drafts,
      [moduleId]: { ...(drafts[moduleId] ?? {}), [sectionId]: Number.isNaN(weight) ? 0 : weight }
    }));
  }

  moduleTotal(module: CourseModuleResponse): number {
    const drafts = this.weightDrafts()[module.id] ?? {};
    const total = module.sections.reduce(
      (sum, section) => sum + Number(drafts[section.id] ?? section.weightPercent),
      0
    );
    return Math.round(total * 100) / 100;
  }

  isWeightTotalValid(module: CourseModuleResponse): boolean {
    return Math.abs(this.moduleTotal(module) - 100) < 0.001;
  }

  saveWeights(module: CourseModuleResponse): void {
    if (!this.isWeightTotalValid(module)) {
      this.modulesMessage.set(`Los pesos de ${module.code} deben sumar 100 (actual: ${this.moduleTotal(module)}%).`);
      return;
    }

    const drafts = this.weightDrafts()[module.id] ?? {};
    const weights = module.sections.map((section) => ({
      sectionId: section.id,
      weightPercent: Number(drafts[section.id] ?? section.weightPercent)
    }));

    this.savingWeights.set(module.id);
    this.modulesMessage.set(null);

    this.modulesService.updateWeights(module.id, { weights }).subscribe({
      next: () => {
        this.savingWeights.set(null);
        this.loadModules();
        this.loadOverview();
        this.modulesMessage.set(`Pesos de ${module.code} actualizados y notas recalculadas.`);
      },
      error: (err) => {
        this.savingWeights.set(null);
        this.modulesMessage.set(this.readError(err, 'No se pudieron guardar los pesos.'));
      }
    });
  }

  toggleActive(module: CourseModuleResponse): void {
    this.modulesService.updateModule(module.id, { active: !module.active }).subscribe({
      next: () => {
        this.loadModules();
        this.loadOverview();
        this.modulesMessage.set(
          `Módulo ${module.code} ${module.active ? 'desactivado' : 'activado'} correctamente.`
        );
      },
      error: (err) => this.modulesMessage.set(this.readError(err, 'No se pudo cambiar el estado del módulo.'))
    });
  }

  // =========================================================================
  // Exportación y sesión
  // =========================================================================

  exportResults(): void {
    const header = ['Nombre', 'Correo', 'Estado', 'Modulos completados', 'Total modulos', 'Nota media', 'Avance', 'Ultima actividad'];
    const rows = this.students().map((student) => [
      `${student.firstName} ${student.lastName}`,
      student.email,
      this.userStatusLabel(student.status),
      String(student.modulesCompleted),
      String(student.modulesTotal),
      student.averageScore === null ? '' : String(student.averageScore),
      `${student.progressPercent}%`,
      this.formatDate(student.lastActivityAt)
    ]);

    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resultados_estudiantes_cyberacademy.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    this.exportSuccess.set(true);
    setTimeout(() => this.exportSuccess.set(false), 3000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // =========================================================================
  // Utilidades de presentación
  // =========================================================================

  fullName(student: StudentOverview): string {
    return `${student.firstName} ${student.lastName}`.trim();
  }

  userStatusLabel(status: UserStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'Activo';
      case 'SUSPENDED':
        return 'Suspendido';
      default:
        return 'Pendiente';
    }
  }

  userStatusClass(status: UserStatus): string {
    switch (status) {
      case 'ACTIVE':
        return 'status-active';
      case 'SUSPENDED':
        return 'status-suspended';
      default:
        return 'status-pending';
    }
  }

  moduleStatusLabel(status: ProgressStatus): string {
    switch (status) {
      case 'COMPLETED':
        return 'Completado';
      case 'IN_PROGRESS':
        return 'En curso';
      case 'FAILED':
        return 'No aprobado';
      default:
        return 'Sin empezar';
    }
  }

  moduleStatusClass(status: ProgressStatus): string {
    switch (status) {
      case 'COMPLETED':
        return 'badge-completed';
      case 'IN_PROGRESS':
        return 'badge-in-progress';
      case 'FAILED':
        return 'badge-failed';
      default:
        return 'badge-not-started';
    }
  }

  formatScore(value: number | null): string {
    return value === null || value === undefined ? '—' : String(value);
  }

  relativeTime(iso: string | null): string {
    if (!iso) return 'Sin actividad';

    const diffMs = Date.now() - new Date(iso).getTime();
    const minutes = Math.floor(diffMs / 60000);

    if (minutes < 1) return 'Ahora mismo';
    if (minutes < 60) return `Hace ${minutes} min`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Hace ${hours} h`;

    const days = Math.floor(hours / 24);
    if (days < 30) return `Hace ${days} día${days === 1 ? '' : 's'}`;

    return this.formatDate(iso);
  }

  formatDate(iso: string | null): string {
    if (!iso) return '—';
    return new Date(iso).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  }

  // =========================================================================
  // Internos
  // =========================================================================

  private buildWeightDrafts(modules: CourseModuleResponse[]): Record<string, Record<string, number>> {
    const drafts: Record<string, Record<string, number>> = {};
    for (const module of modules) {
      drafts[module.id] = {};
      for (const section of module.sections) {
        drafts[module.id][section.id] = Number(section.weightPercent);
      }
    }
    return drafts;
  }

  private readError(err: unknown, fallback: string): string {
    const error = err as { status?: number; error?: { message?: string } };
    if (error?.status === 0) {
      return 'No se pudo conectar con el servidor. Verifica que el backend esté en ejecución.';
    }
    if (error?.status === 403) {
      return 'Tu usuario no tiene permisos de administrador.';
    }
    return error?.error?.message || fallback;
  }
}
