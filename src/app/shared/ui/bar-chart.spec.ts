import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BarChartComponent } from './bar-chart';

describe('BarChartComponent', () => {
  let fixture: ComponentFixture<BarChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [BarChartComponent] }).compileComponents();

    fixture = TestBed.createComponent(BarChartComponent);
    fixture.componentRef.setInput('groups', [
      { label: 'M1', values: [3, 2, 1], detail: 'Fundamentos' },
      { label: 'M2', values: [5, 0, 2] },
    ]);
    fixture.componentRef.setInput('series', [
      { label: 'Completado', tone: 'secure' },
      { label: 'En curso', tone: 'warn' },
      { label: 'No aprobado', tone: 'threat' },
    ]);
    await fixture.whenStable();
  });

  it('dibuja una barra por cada grupo y serie', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('rect.bar').length).toBe(6);
  });

  it('muestra la leyenda de las series', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('.legend li').length).toBe(3);
    expect(element.querySelector('.legend')?.textContent).toContain('Completado');
  });

  it('resume los valores para lectores de pantalla', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.getAttribute('aria-label')).toContain(
      'M1: Completado 3, En curso 2, No aprobado 1',
    );
  });
});
