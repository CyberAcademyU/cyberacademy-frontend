import { HttpClient, HttpErrorResponse, provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { ApiLoadingService } from '../services/api-loading';
import { API_TIMEOUT_MS, apiLoadingInterceptor } from './api-loading.interceptor';

describe('apiLoadingInterceptor', () => {
  let http: HttpClient;
  let requests: HttpTestingController;
  let loading: ApiLoadingService;

  beforeEach(() => {
    vi.useFakeTimers();
    TestBed.configureTestingModule({ providers: [
      provideHttpClient(withInterceptors([apiLoadingInterceptor])), provideHttpClientTesting()
    ] });
    http = TestBed.inject(HttpClient);
    requests = TestBed.inject(HttpTestingController);
    loading = TestBed.inject(ApiLoadingService);
  });

  afterEach(() => { requests.verify(); TestBed.resetTestingModule(); vi.useRealTimers(); });

  it('keeps the loader visible until all concurrent requests finish', () => {
    http.get(`${environment.apiUrl}/one`).subscribe();
    http.get(`${environment.apiUrl}/two`).subscribe();
    const one = requests.expectOne(`${environment.apiUrl}/one`);
    const two = requests.expectOne(`${environment.apiUrl}/two`);
    vi.advanceTimersByTime(350);
    expect(loading.visible()).toBe(true);
    one.flush({});
    expect(loading.visible()).toBe(true);
    two.flush({});
    expect(loading.visible()).toBe(false);
  });

  it('reports timeout and stops loading without retrying the request', () => {
    let error: HttpErrorResponse | undefined;
    http.post(`${environment.apiUrl}/auth/register`, {}).subscribe({ error: err => error = err });
    const request = requests.expectOne(`${environment.apiUrl}/auth/register`);
    vi.advanceTimersByTime(10000);
    expect(loading.slow()).toBe(true);
    vi.advanceTimersByTime(API_TIMEOUT_MS - 10000);
    expect(error?.status).toBe(408);
    expect(error?.error.message).toContain('Comprueba el resultado');
    expect(request.cancelled).toBe(true);
    expect(loading.visible()).toBe(false);
    expect(loading.slow()).toBe(false);
    requests.expectNone(`${environment.apiUrl}/auth/register`);
  });

  it('does not track requests outside the API', () => {
    http.get('https://example.com/resource').subscribe();
    const request = requests.expectOne('https://example.com/resource');
    vi.advanceTimersByTime(350);
    expect(loading.visible()).toBe(false);
    request.flush({});
  });
});
