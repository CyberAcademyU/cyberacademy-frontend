import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { StudentComponent } from './student';
import { ModuleSummary } from '../../../core/models/course-module.model';

describe('Student', () => {
  let component: StudentComponent;
  let fixture: ComponentFixture<StudentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StudentComponent],
      providers: [provideRouter([]), provideHttpClient(), provideHttpClientTesting()],
    }).compileComponents();

    fixture = TestBed.createComponent(StudentComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  const module = (index: number, changes: Partial<ModuleSummary> = {}): ModuleSummary => ({
    moduleId: `module-${index}`, code: `CA-0${index}`, title: `Módulo ${index}`,
    description: 'Contenido educativo', cover: 'challenge', orderIndex: index,
    status: 'COMPLETED', score: 100, passingScore: 70,
    totalSections: 4, completedSections: 4, progressPercent: 100, passed: true,
    startedAt: null, completedAt: '2026-11-24T00:00:00Z', lastActivityAt: null,
    saved: false, locked: false, practiceAttempts: 1, maxPracticeAttempts: 1, ...changes,
  });
  function show(modules: ModuleSummary[]) {
    component.summaries.set(modules);
    component.loading.set(false);
    fixture.detectChanges();
  }

  it('felicita por terminar los ocho módulos y presenta la certificación como futura', () => {
    show(Array.from({ length: 8 }, (_, index) => module(index)));
    expect(component.allModulesFinished()).toBe(true);
    const hero = fixture.nativeElement.querySelector('.hero');
    expect(hero.textContent).toContain('¡Felicitaciones por completar todos los módulos de CyberAcademy!');
    expect(hero.textContent).toContain('más contenido, nuevos módulos y una certificación');
    expect(hero.textContent).toContain('Próximamente');
    expect(hero.textContent).not.toContain('Descargar certificado');
    expect(hero.querySelector('.completion-message').textContent).not.toMatch(/\p{Extended_Pictographic}/u);
    hero.querySelector('button').click();
    expect(component.showResultsModal()).toBe(true);
  });

  it('no felicita por un catálogo vacío, incompleto, cargando o con errores', () => {
    show([]);
    expect(component.allModulesFinished()).toBe(false);
    show([module(0, { status: 'IN_PROGRESS', completedSections: 3, progressPercent: 75 })]);
    expect(component.allModulesFinished()).toBe(false);
    show([module(0)]);
    component.loading.set(true);
    expect(component.allModulesFinished()).toBe(false);
    component.loading.set(false);
    component.error.set('No se pudo cargar el progreso.');
    fixture.detectChanges();
    expect(component.allModulesFinished()).toBe(false);
    expect(fixture.nativeElement.querySelector('.completion-message')).toBeNull();
  });

  it('actualiza la felicitación al terminar el último módulo sin recargar', () => {
    show([module(0), module(1, { status: 'IN_PROGRESS', completedSections: 3, progressPercent: 75 })]);
    expect(fixture.nativeElement.querySelector('.completion-message')).toBeNull();
    component.summaries.update(modules => modules.map(item =>
      item.moduleId === 'module-1' ? module(1) : item));
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.completion-message')).not.toBeNull();
  });

  it('retira la felicitación si aparece un nuevo módulo pendiente', () => {
    show([module(0)]);
    expect(component.allModulesFinished()).toBe(true);
    component.summaries.update(modules => [...modules, module(1, {
      status: 'NOT_STARTED', completedSections: 0, progressPercent: 0, practiceAttempts: 0,
    })]);
    fixture.detectChanges();
    expect(component.allModulesFinished()).toBe(false);
    expect(fixture.nativeElement.querySelector('.completion-message')).toBeNull();
  });

  it('reconoce un recorrido finalizado sin confundirlo con aprobar todos los módulos', () => {
    show([module(0, { status: 'FAILED', score: 50, passed: false })]);
    expect(component.allModulesFinished()).toBe(true);
    expect(fixture.nativeElement.querySelector('.hero').textContent).not.toContain('aprobaste');
    show([module(0, { status: 'FAILED', score: 50, passed: false, maxPracticeAttempts: 2 })]);
    expect(component.allModulesFinished()).toBe(false);
    show([module(0, { totalSections: 0, completedSections: 0 })]);
    expect(component.allModulesFinished()).toBe(false);
  });
});
