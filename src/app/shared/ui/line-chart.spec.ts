import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LineChartComponent } from './line-chart';

describe('LineChartComponent', () => {
  let fixture: ComponentFixture<LineChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [LineChartComponent] }).compileComponents();

    fixture = TestBed.createComponent(LineChartComponent);
    fixture.componentRef.setInput('points', [
      { label: 'M1', value: 25, detail: 'Fundamentos' },
      { label: 'M2', value: 50 },
      { label: 'M3', value: 100 },
    ]);
    await fixture.whenStable();
  });

  it('dibuja un punto y una etiqueta por cada valor', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.querySelectorAll('circle.dot').length).toBe(3);
    expect(element.querySelectorAll('path.line').length).toBe(1);
    expect(element.querySelectorAll('path.area').length).toBe(1);
    expect(element.querySelectorAll('text.point-value').length).toBe(3);
  });

  it('resume la serie para lectores de pantalla', () => {
    const element = fixture.nativeElement as HTMLElement;

    expect(element.getAttribute('aria-label')).toContain('M2 50%');
    expect(element.getAttribute('aria-label')).toContain('M3 100%');
  });
});
