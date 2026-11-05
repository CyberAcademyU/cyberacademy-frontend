import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { transientMessage } from './transient-message';

@Component({ template: '' })
class HostComponent {
  message = transientMessage<string | null>(null);
}

describe('transientMessage', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => { TestBed.resetTestingModule(); vi.useRealTimers(); });

  it('clears a message after five seconds and restarts for a newer message', () => {
    const fixture = TestBed.createComponent(HostComponent);
    const message = fixture.componentInstance.message;
    message.set('Primer mensaje');
    vi.advanceTimersByTime(4000);
    message.set('Mensaje nuevo');
    vi.advanceTimersByTime(1000);
    expect(message()).toBe('Mensaje nuevo');
    vi.advanceTimersByTime(4000);
    expect(message()).toBeNull();
    fixture.destroy();
  });

  it('cancels the timer when the component is destroyed', () => {
    const fixture = TestBed.createComponent(HostComponent);
    fixture.componentInstance.message.set('Aviso');
    fixture.destroy();
    vi.advanceTimersByTime(5000);
    expect(fixture.componentInstance.message()).toBe('Aviso');
  });
});
