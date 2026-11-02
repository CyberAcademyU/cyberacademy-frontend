import { TestBed } from '@angular/core/testing';
import { ModuleCardComponent } from './module-card';
import { ModuleSummary } from '../../../core/models/course-module.model';

describe('ModuleCardComponent', () => {
  it('indica que el módulo está bloqueado y deshabilita su apertura', () => {
    const fixture = TestBed.createComponent(ModuleCardComponent);
    const summary: ModuleSummary = {
      moduleId: '2', code: 'MOD2', title: 'Segundo módulo', description: null, cover: null,
      orderIndex: 2, status: 'NOT_STARTED', score: null, passingScore: 70,
      totalSections: 4, completedSections: 0, progressPercent: 0, passed: false,
      startedAt: null, completedAt: null, lastActivityAt: null, saved: false,
      locked: true, practiceAttempts: 0, maxPracticeAttempts: 1
    };
    fixture.componentRef.setInput('module', summary);
    fixture.detectChanges();
    const button = fixture.nativeElement.querySelector('.open') as HTMLButtonElement;
    expect(button.disabled).toBe(true);
    expect(fixture.nativeElement.textContent).toContain('Termina los módulos anteriores');
  });
});
