import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';
import { ModulesService } from '../../../core/services/modules';
import { CourseModuleResponse } from '../../../core/models/course-module.model';

export interface ModuleItem {
  id: number;
  name: string;
  category: string;
  percentage: number;
  studentsCompleted: number;
  avgTime: string;
}

export interface ActivityItem {
  name: string;
  activity: string;
  timeAgo: string;
}

export interface StudentUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  modulesCompleted: number;
  diagnosticScore: number;
  finalScore: number;
}

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
  private router = inject(Router);

  user = this.authService.currentUserSignal;
  activeTab = signal<'resumen' | 'modulos' | 'usuarios'>('resumen');
  exportSuccess = signal(false);

  // --- Gestión real de módulos ---
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

  // Datos de demostración de las pestañas Resumen y Usuarios
  modules: ModuleItem[] = [
    { id: 1, name: '1. Bandeja de entrada', category: 'Phishing e Ingeniería Social', percentage: 93, studentsCompleted: 140, avgTime: '12 min' },
    { id: 2, name: '2. Crea tu contraseña', category: 'Autenticación y Credenciales', percentage: 81, studentsCompleted: 122, avgTime: '15 min' },
    { id: 3, name: '3. Perfil expuesto', category: 'Privacidad y Huella Digital', percentage: 70, studentsCompleted: 105, avgTime: '18 min' },
    { id: 4, name: '4. La foto delatora', category: 'Metadatos y Geolocalización', percentage: 58, studentsCompleted: 87, avgTime: '14 min' },
    { id: 5, name: '5. Wi-Fi del café', category: 'Redes no seguras y MitM', percentage: 52, studentsCompleted: 78, avgTime: '20 min' },
    { id: 6, name: '6. Desafío final', category: 'Simulación Integral', percentage: 47, studentsCompleted: 71, avgTime: '25 min' },
  ];

  recentActivities: ActivityItem[] = [
    { name: 'Sofía Rivera', activity: 'Completó el Desafío final', timeAgo: 'Hace 5 min' },
    { name: 'Luis Moreno', activity: 'Terminó el Módulo 3', timeAgo: 'Hace 18 min' },
    { name: 'Ana Pérez', activity: 'Empezó el Módulo 5', timeAgo: 'Hace 42 min' },
    { name: 'Daniel Ruiz', activity: 'Hizo la prueba diagnóstica', timeAgo: 'Hace 1 hora' },
  ];

  students: StudentUser[] = [
    { id: '1', name: 'Sofía Rivera', email: 'sofia.rivera@cyberacademy.com', role: 'STUDENT', status: 'Activo', modulesCompleted: 6, diagnosticScore: 48, finalScore: 92 },
    { id: '2', name: 'Luis Moreno', email: 'luis.moreno@cyberacademy.com', role: 'STUDENT', status: 'Activo', modulesCompleted: 3, diagnosticScore: 50, finalScore: 84 },
    { id: '3', name: 'Ana Pérez', email: 'ana.perez@cyberacademy.com', role: 'STUDENT', status: 'Activo', modulesCompleted: 4, diagnosticScore: 55, finalScore: 88 },
    { id: '4', name: 'Daniel Ruiz', email: 'daniel.ruiz@cyberacademy.com', role: 'STUDENT', status: 'Activo', modulesCompleted: 1, diagnosticScore: 42, finalScore: 78 },
  ];

  ngOnInit(): void {
    this.loadModules();
  }

  selectTab(tab: 'resumen' | 'modulos' | 'usuarios'): void {
    this.activeTab.set(tab);
    if (tab === 'modulos') {
      this.loadModules();
    }
  }

  // --- Módulos ---

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
        this.modulesMessage.set(
          `Módulo ${module.code} ${module.active ? 'desactivado' : 'activado'} correctamente.`
        );
      },
      error: (err) => this.modulesMessage.set(this.readError(err, 'No se pudo cambiar el estado del módulo.'))
    });
  }

  // --- Exportación y sesión ---

  exportResults(): void {
    const csvHeader = 'Nombre,Correo,Rol,Estado,ModulosCompletados,PuntajeDiagnostico,PuntajeFinal\n';
    const csvRows = this.students.map(s =>
      `"${s.name}","${s.email}","${s.role}","${s.status}",${s.modulesCompleted},${s.diagnosticScore},${s.finalScore}`
    ).join('\n');

    const blob = new Blob([csvHeader + csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'resultados_estudiantes_cyberacademy.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    this.exportSuccess.set(true);
    setTimeout(() => this.exportSuccess.set(false), 3000);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }

  // --- Utilidades ---

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
    return error?.error?.message || fallback;
  }
}
