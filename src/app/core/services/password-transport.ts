import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { ApiResponse } from '../models/user.model';

/** Contraseña cifrada que el backend descifra con su clave ECDH. */
export interface SealedSecret {
  keyId: string;
  clientPublicKey: string;
  data: string;
}

interface ServerKey {
  keyId: string;
  algorithm: string;
  publicKey: string;
}

const SALT = new TextEncoder().encode('cyberacademy-password-salt-v1');
const INFO = new TextEncoder().encode('cyberacademy-password-v1');
const IV_LENGTH = 12;

/**
 * Cifra contraseñas en el navegador: ECDH P-256 efímero + HKDF-SHA256 + AES-256-GCM.
 *
 * La clave del servidor es pública y determinista (no cambia entre reinicios), así
 * que el sobre siempre se puede descifrar. El objetivo es que la contraseña no
 * aparezca en claro en el inspector de red; TLS ya protege el tránsito y esto no
 * es una defensa frente a XSS: quien ejecuta código en la página puede leerla
 * antes de cifrarla.
 */
@Injectable({ providedIn: 'root' })
export class PasswordTransportService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = environment.apiUrl;
  private serverKey?: Promise<ServerKey>;

  /**
   * Devuelve el sobre cifrado, o `null` si WebCrypto no está disponible (contexto
   * no seguro). En ese caso el backend decide si acepta texto plano.
   */
  async seal(password: string): Promise<SealedSecret | null> {
    const subtle = globalThis.crypto?.subtle;
    if (!subtle) return null;

    const server = await this.getServerKey();
    const pair = await subtle.generateKey({ name: 'ECDH', namedCurve: 'P-256' }, true, ['deriveBits']);
    const serverPublic = await subtle.importKey(
      'raw', fromBase64(server.publicKey), { name: 'ECDH', namedCurve: 'P-256' }, false, []);
    const shared = await subtle.deriveBits({ name: 'ECDH', public: serverPublic }, pair.privateKey, 256);
    const hkdf = await subtle.importKey('raw', shared, 'HKDF', false, ['deriveKey']);
    const aesKey = await subtle.deriveKey(
      { name: 'HKDF', hash: 'SHA-256', salt: SALT, info: INFO },
      hkdf, { name: 'AES-GCM', length: 256 }, false, ['encrypt']);

    const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
    const ciphertext = new Uint8Array(await subtle.encrypt(
      { name: 'AES-GCM', iv, tagLength: 128 }, aesKey, new TextEncoder().encode(password)));
    const payload = new Uint8Array(iv.length + ciphertext.length);
    payload.set(iv);
    payload.set(ciphertext, iv.length);

    const rawClient = new Uint8Array(await subtle.exportKey('raw', pair.publicKey));
    return {
      keyId: server.keyId,
      clientPublicKey: toBase64(rawClient),
      data: toBase64(payload)
    };
  }

  /** Precalienta la clave al arrancar para que el primer login no espere. */
  warmUp(): void {
    void this.getServerKey().catch(() => undefined);
  }

  /** La clave es determinista en el servidor; se cachea durante la vida de la pestaña. */
  private getServerKey(): Promise<ServerKey> {
    this.serverKey ??= firstValueFrom(
      this.http.get<ApiResponse<ServerKey>>(`${this.apiUrl}/auth/encryption-key`)
    ).then(response => {
      if (!response.data) throw new Error('El servidor no devolvió la clave de cifrado');
      return response.data;
    }).catch(error => {
      this.serverKey = undefined;
      throw error;
    });
    return this.serverKey;
  }
}

/**
 * Sustituye cada contraseña del cuerpo por su sobre cifrado. Si el navegador no
 * puede cifrar, devuelve el cuerpo original para no romper clientes antiguos o
 * contextos sin WebCrypto; el backend decidirá si lo acepta.
 */
export async function sealPasswords(
  transport: PasswordTransportService,
  payload: object,
  fields: Record<string, string>
): Promise<Record<string, unknown>> {
  const body = { ...(payload as Record<string, unknown>) };
  const entries = Object.entries(fields).filter(([plain]) => typeof body[plain] === 'string');
  if (!entries.length) return body;

  let sealed: Array<SealedSecret | null>;
  try {
    sealed = await Promise.all(entries.map(([plain]) => transport.seal(body[plain] as string)));
  } catch (error) {
    console.warn('No se pudo cifrar la contraseña en el navegador; se envía sobre TLS.', error);
    return body;
  }
  if (sealed.some(value => value === null)) return body;

  entries.forEach(([plain, sealedField], index) => {
    delete body[plain];
    body[sealedField] = sealed[index];
  });
  return body;
}

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
