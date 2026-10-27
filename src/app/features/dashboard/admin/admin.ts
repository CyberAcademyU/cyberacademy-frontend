import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

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
  imports: [CommonModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css'
})
export class AdminDashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUserSignal;
  activeTab = signal<'resumen' | 'modulos' | 'usuarios'>('resumen');
  exportSuccess = signal(false);

  // Lista exacta de 6 módulos según el diseño
  modules: ModuleItem[] = [
    { id: 1, name: '1. Bandeja de entrada', category: 'Phishing e Ingeniería Social', percentage: 93, studentsCompleted: 140, avgTime: '12 min' },
    { id: 2, name: '2. Crea tu contraseña', category: 'Autenticación y Credenciales', percentage: 81, studentsCompleted: 122, avgTime: '15 min' },
    { id: 3, name: '3. Perfil expuesto', category: 'Privacidad y Huella Digital', percentage: 70, studentsCompleted: 105, avgTime: '18 min' },
    { id: 4, name: '4. La foto delatora', category: 'Metadatos y Geolocalización', percentage: 58, studentsCompleted: 87, avgTime: '14 min' },
    { id: 5, name: '5. Wi-Fi del café', category: 'Redes no seguras y MitM', percentage: 52, studentsCompleted: 78, avgTime: '20 min' },
    { id: 6, name: '6. Desafío final', category: 'Simulación Integral', percentage: 47, studentsCompleted: 71, avgTime: '25 min' },
  ];

  // Actividades recientes
  recentActivities: ActivityItem[] = [
    { name: 'Sofía Rivera', activity: 'Completó el Desafío final', timeAgo: 'Hace 5 min' },
    { name: 'Luis Moreno', activity: 'Terminó el Módulo 3', timeAgo: 'Hace 18 min' },
    { name: 'Ana Pérez', activity: 'Empezó el Módulo 5', timeAgo: 'Hace 42 min' },
    { name: 'Daniel Ruiz', activity: 'Hizo la prueba diagnóstica', timeAgo: 'Hace 1 hora' },
  ];

  // Estudiantes
  students: StudentUser[] = [
    { id: '1', name: 'Sofía Rivera', email: 'sofia.rivera@cyberacademy.com', role: 'STUDENT', status: 'Activo', modulesCompleted: 6, diagnosticScore: 48, finalScore: 92 },
    { id: '2', name: 'Luis Moreno', email: 'luis.moreno@cyberacademy.com', role: 'STUDENT', status: 'Activo', modulesCompleted: 3, diagnosticScore: 50, finalScore: 84 },
    { id: '3', name: 'Ana Pérez', email: 'ana.perez@cyberacademy.com', role: 'STUDENT', status: 'Activo', modulesCompleted: 4, diagnosticScore: 55, finalScore: 88 },
    { id: '4', name: 'Daniel Ruiz', email: 'daniel.ruiz@cyberacademy.com', role: 'STUDENT', status: 'Activo', modulesCompleted: 1, diagnosticScore: 42, finalScore: 78 },
  ];

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
}