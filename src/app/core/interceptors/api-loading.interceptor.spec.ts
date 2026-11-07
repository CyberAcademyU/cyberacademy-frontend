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

  it('keeps the loader visible until all concurrent actions finish', () => {
    http.post(`${environment.apiUrl}/auth/login`, {}).subscribe();
    http.post(`${environment.apiUrl}/auth/resend-otp`, {}).subscribe();
    const one = requests.expectOne(`${environment.apiUrl}/auth/login`);
    const two = requests.expectOne(`${environment.apiUrl}/auth/resend-otp`);
    vi.advanceTimersByTime(350);
    expect(loading.visible()).toBe(true);
    one.flush({});
    expect(loading.visible()).toBe(true);
    two.flush({});
    expect(loading.visible()).toBe(false);
  });

  it('lets content skeletons show during reads while keeping the timeout', () => {
    let error: HttpErrorResponse | undefined;
    http.get(`${environment.apiUrl}/public/modules`).subscribe({ error: err => error = err });
    http.get(`${environment.apiUrl}/admin/students`).subscribe();
    const catalog = requests.expectOne(`${environment.apiUrl}/public/modules`);
    const students = requests.expectOne(`${environment.apiUrl}/admin/students`);
    vi.advanceTimersByTime(350);
    expect(loading.visible()).toBe(false);
    students.flush({});
    vi.advanceTimersByTime(API_TIMEOUT_MS - 350);
    expect(error?.status).toBe(408);
    expect(catalog.cancelled).toBe(true);
    expect(loading.visible()).toBe(false);
  });

  it('does not let a concurrent read hide an action loader', () => {
    http.get(`${environment.apiUrl}/modules`).subscribe();
    http.put(`${environment.apiUrl}/modules/one`, {}).subscribe();
    const read = requests.expectOne(`${environment.apiUrl}/modules`);
    const action = requests.expectOne(`${environment.apiUrl}/modules/one`);
    vi.advanceTimersByTime(350);
    expect(loading.visible()).toBe(true);
    read.flush({});
    expect(loading.visible()).toBe(true);
    action.flush({});
    expect(loading.visible()).toBe(false);
  });

  it('does not overlay the background logout request', () => {
    http.post(`${environment.apiUrl}/auth/logout`, {}).subscribe();
    const logout = requests.expectOne(`${environment.apiUrl}/auth/logout`);
    vi.advanceTimersByTime(350);
    expect(loading.visible()).toBe(false);
    logout.flush({});
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
