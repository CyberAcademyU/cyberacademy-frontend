import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { webcrypto } from 'node:crypto';
import { PasswordTransportService } from './password-transport';
import { environment } from '../../../environments/environment';

describe('PasswordTransportService', () => {
  let service: PasswordTransportService;
  let requests: HttpTestingController;
  let previousCrypto: Crypto;

  beforeEach(() => {
    // jsdom no implementa SubtleCrypto; Node sí. Se usa el mismo WebCrypto real.
    previousCrypto = globalThis.crypto;
    Object.defineProperty(globalThis, 'crypto', {
      value: webcrypto as unknown as Crypto,
      configurable: true
    });
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    service = TestBed.inject(PasswordTransportService);
    requests = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    requests.verify();
    Object.defineProperty(globalThis, 'crypto', { value: previousCrypto, configurable: true });
  });

  it('produce un sobre que se descifra con la clave privada del servidor', async () => {
    const subtle = globalThis.crypto.subtle;
    const serverPair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const rawServer = new Uint8Array(await subtle.exportKey('raw', serverPair.publicKey));
    expect(rawServer[0]).toBe(0x04);
    expect(rawServer.length).toBe(65);

    const sealing = service.seal('contraseña-segura');
    const keyRequest = requests.expectOne(`${environment.apiUrl}/auth/encryption-key`);
    expect(keyRequest.request.method).toBe('GET');
    keyRequest.flush({
      success: true,
      data: { keyId: 'kid-1', algorithm: 'ECDH-P256', publicKey: toBase64(rawServer) }
    });

    const sealed = await sealing;
    expect(sealed).not.toBeNull();
    expect(sealed!.keyId).toBe('kid-1');

    const payload = fromBase64(sealed!.data);
    expect(payload.length).toBeGreaterThan(12 + 16);

    const clientPublic = await subtle.importKey(
      'raw', fromBase64(sealed!.clientPublicKey), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const shared = await subtle.deriveBits({ name: 'ECDH', public: clientPublic }, serverPair.privateKey, 256);
    const hkdf = await subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
    const aes = await subtle.deriveKey({
      name: 'HKDF',
      hash: 'SHA-256',
      salt: new TextEncoder().encode('cyberacademy-password-salt-v1'),
      info: new TextEncoder().encode('cyberacademy-password-v1')
    }, hkdf, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);

    const plain = await subtle.decrypt(
      { name: 'AES-GCM', iv: payload.slice(0, 12), tagLength: 128 }, aes, payload.slice(12));
    expect(new TextDecoder().decode(plain)).toBe('contraseña-segura');
  });

  it('cachea la clave pública entre envíos', async () => {
    const subtle = globalThis.crypto.subtle;
    const serverPair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const rawServer = new Uint8Array(await subtle.exportKey('raw', serverPair.publicKey));

    const first = service.seal('primera-clave');
    requests.expectOne(`${environment.apiUrl}/auth/encryption-key`).flush({
      data: { keyId: 'kid-2', algorithm: 'ECDH-P256', publicKey: toBase64(rawServer) }
    });
    await first;

    const second = service.seal('segunda-clave');
    await second;
    requests.expectNone(`${environment.apiUrl}/auth/encryption-key`);
  });

  it('devuelve null cuando el contexto no ofrece WebCrypto', async () => {
    Object.defineProperty(globalThis, 'crypto', {
      value: { getRandomValues: previousCrypto.getRandomValues.bind(previousCrypto) },
      configurable: true
    });
    expect(await service.seal('sin-subtle')).toBeNull();
  });
});

function toBase64(bytes: Uint8Array): string {
  let binary = '';
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(value: string): Uint8Array<ArrayBuffer> {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index++) bytes[index] = binary.charCodeAt(index);
  return bytes;
}
