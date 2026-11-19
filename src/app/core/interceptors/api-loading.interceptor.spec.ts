import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { API_TIMEOUT_MS, apiLoadingInterceptor } from './api-loading.interceptor';

describe('apiLoadingInterceptor', () => {
  let http: HttpClient;
  let requests: HttpTestingController;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([apiLoadingInterceptor])), provideHttpClientTesting()
    ] });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
  });

  afterEach(() => { requests.verify(); TestBed.resetTestingModule(); vi.useRealTimers(); });

  it('times out slow API reads', () => {
    let error: HttpErrorResponse | undefined;
    http.get(`${environment.apiUrl}/public/modules`).subscribe({ error: err => error = err });
    http.get(`${environment.apiUrl}/admin/students`).subscribe();
    const catalog = requests.expectOne(`${environment.apiUrl}/public/modules`);
    const students = requests.expectOne(`${environment.apiUrl}/admin/students`);
    vi.advanceTimersByTime(350);
    students.flush({});
    vi.advanceTimersByTime(API_TIMEOUT_MS - 350);
    expect(error?.status).toBe(408);
    expect(catalog.cancelled).toBe(true);
  });

  it('reports timeout without retrying the request', () => {
    let error: HttpErrorResponse | undefined;
    http.post(`${environment.apiUrl}/auth/register`, {}).subscribe({ error: err => error = err });
    const request = requests.expectOne(`${environment.apiUrl}/auth/register`);
    vi.advanceTimersByTime(API_TIMEOUT_MS);
    expect(error?.status).toBe(408);
    expect(error?.error.message).toContain('Comprueba el resultado');
    expect(request.cancelled).toBe(true);
    requests.expectNone(`${environment.apiUrl}/auth/register`);
  });

  it('does not track requests outside the API', () => {
    http.get('https://example.com/resource').subscribe();
    const request = requests.expectOne('https://example.com/resource');
    vi.advanceTimersByTime(API_TIMEOUT_MS);
    expect(request.cancelled).toBe(false);
    request.flush({});
  });
});
