import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ApiLoadingService {
  readonly visible = signal(false);
  readonly slow = signal(false);
  private pending = 0;
  private showTimer?: ReturnType<typeof setTimeout>;
  private slowTimer?: ReturnType<typeof setTimeout>;

  start(): void {
    this.pending++;
    if (this.pending !== 1) return;
    this.showTimer = setTimeout(() => this.visible.set(true), 350);
    this.slowTimer = setTimeout(() => this.slow.set(true), 10000);
  }

  finish(): void {
    this.pending = Math.max(0, this.pending - 1);
    if (this.pending !== 0) return;
    clearTimeout(this.showTimer);
    clearTimeout(this.slowTimer);
    this.visible.set(false);
    this.slow.set(false);
  }
}
