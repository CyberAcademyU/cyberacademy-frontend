import { Component, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth';

export interface StudentModule {
  id: number;
  title: string;
  description: string;
  status: 'completed' | 'in_progress' | 'available' | 'locked';
  statusLabel: string;
  progressPercentage?: number;
  category: string;
  detailedObjectives: string[];
}

@Component({
  selector: 'app-student-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './student.html',
  styleUrl: './student.css'
})
export class StudentDashboardComponent {
  private authService = inject(AuthService);
  private router = inject(Router);

  user = this.authService.currentUserSignal;

  // Toma el nombre del usuario logueado o fallback a 'Ana' según la captura
  studentName = computed(() => {
    const u = this.user();
    return u?.firstName ? u.firstName : 'Ana';
  });

  // Puntos acumulados y nivel
  points = signal<number>(340);
  level = signal<number>(2);

  // Lista de 6 módulos idénticos al diseño
  modules = signal<StudentModule[]>([
    {
      id: 1,
      title: '1. Bandeja de entrada',
      description: 'Phishing, enlaces y remitentes falsos',
      status: 'completed',
      statusLabel: 'Completado · 90%',
      progressPercentage: 90,
      category: 'Phishing e Ingeniería Social',
      detailedObjectives: [
        'Detección de técnicas avanzadas de spoofing y phishing por correo',
        'Análisis de cabeceras de email y URLs enmascaradas',
        'Protocolo de reporte inmediato y contención'
      ]
    },
    {
      id: 2,
      title: '2. Crea tu contraseña',
      description: 'Contraseñas robustas y verificación en dos pasos',
      status: 'in_progress',
      statusLabel: 'En curso · 40%',
      progressPercentage: 40,
      category: 'Autenticación y Credenciales',
      detailedObjectives: [
        'Generación de frases de acceso con alta entropía',
        'Configuración de factores 2FA/MFA mediante TOTP',
        'Prevención de ataques de fuerza bruta y diccionario'
      ]
    },
    {
      id: 3,
      title: '3. Perfil expuesto',
      description: 'Privacidad en redes sociales',
      status: 'available',
      statusLabel: 'Disponible',
      category: 'Privacidad y Huella Digital',
      detailedObjectives: [
        'Auditoría de información pública compartida',
        'Protección ante doxxing y perfilado malicioso',
        'Configuración defensiva de privacidad en plataformas sociales'
      ]
    },
    {
      id: 4,
      title: '4. La foto delatora',
      description: 'Metadatos y ubicación GPS',
      status: 'available',
      statusLabel: 'Disponible',
      category: 'Metadatos y Geolocalización',
      detailedObjectives: [
        'Extracción e inspección forense de etiquetas EXIF y GPS',
        'Riesgos del intercambio de imágenes con metadatos activos',
        'Herramientas y métodos de sanitización digital'
      ]
    },
    {
      id: 5,
      title: '5. Wi-Fi del café',
      description: 'Redes públicas, HTTPS y VPN',
      status: 'available',
      statusLabel: 'Disponible',
      category: 'Seguridad en Redes',
      detailedObjectives: [
        'Vulnerabilidades en puntos de acceso inalámbricos públicos',
        'Ataques Man-in-the-Middle (MitM) y suplantación de DNS',
        'Uso de túneles VPN cifrados y verificación TLS'
      ]
    },
    {
      id: 6,
      title: '6. Desafío final',
      description: 'Caso integrador de todas las amenazas',
      status: 'available',
      statusLabel: 'Disponible',
      category: 'Simulación Integral',
      detailedObjectives: [
        'Simulación de respuesta ante incidentes combinados',
        'Toma de decisiones bajo presión de tiempo real',
        'Evaluación sumativa de madurez en ciberseguridad'
      ]
    }
  ]);

  // Control interactivo de modales
  selectedModule = signal<StudentModule | null>(null);
  showResultsModal = signal<boolean>(false);

  openModule(module: StudentModule): void {
    this.selectedModule.set(module);
  }

  closeModule(): void {
    this.selectedModule.set(null);
  }

  openResults(): void {
    this.showResultsModal.set(true);
  }

  closeResults(): void {
    this.showResultsModal.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/login']);
  }
}

// Exportación como StudentComponent para compatibilidad total con tus rutas
export { StudentDashboardComponent as StudentComponent };