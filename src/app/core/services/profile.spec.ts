import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { ProfileService } from './profile';
import { PasswordTransportService } from './password-transport';
import { environment } from '../../../environments/environment';

describe('ProfileService.changePassword', () => {
  it('cifra la contraseña actual y la nueva, sin enviar texto plano', async () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        {
          provide: PasswordTransportService,
          useValue: {
            warmUp: () => undefined,
            seal: (value: string) => Promise.resolve({
              keyId: 'kid',
              clientPublicKey: 'client',
              data: value === 'actual-123' ? 'sobre-actual' : 'sobre-nueva'
            })
          }
        }
      ]
    });
    const profile = TestBed.inject(ProfileService);
    const requests = TestBed.inject(HttpTestingController);

    const pending = firstValueFrom(profile.changePassword({ currentPassword: 'actual-123', newPassword: 'nueva-1234' }));
    await new Promise(resolve => setTimeout(resolve, 0));
    const request = requests.expectOne(`${environment.apiUrl}/profile/password`);

    expect(request.request.body.currentPassword).toBeUndefined();
    expect(request.request.body.newPassword).toBeUndefined();
    expect(request.request.body.sealedCurrentPassword.data).toBe('sobre-actual');
    expect(request.request.body.sealedNewPassword.data).toBe('sobre-nueva');
    expect(JSON.stringify(request.request.body)).not.toContain('actual-123');
    expect(JSON.stringify(request.request.body)).not.toContain('nueva-1234');

    request.flush({ success: true });
    await pending;
    requests.verify();
  });
});
