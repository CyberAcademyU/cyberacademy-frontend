# CyberAcademy — Frontend

Aplicación web de **CyberAcademy** construida con Angular 22 (standalone components + signals). Consume la API REST del backend en `/api/v1`.

## Stack

| Tecnología | Versión |
|---|---|
| Angular | 22 |
| TypeScript | 6.0 |
| RxJS | 7.8 |
| Vitest | 5 |
| Prettier | 3 |

## Requisitos

- Node.js 20+ (recomendado 22)
- npm 10+

## Instalación y ejecución

```bash
npm install
npm start
```

La app queda en `http://localhost:4200`.

## Configuración

La URL del backend se define en `src/environments/`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:8080/api/v1'
};
```

Archivos:

- `environment.development.ts` → `ng serve`
- `environment.ts` → build de producción

Si despliegas el backend en otro dominio, cambia `apiUrl` aquí (o usa el `fileReplacements` de `angular.json`).

> El backend debe permitir el origen del frontend en `CORS_ALLOWED_ORIGINS`.

## Scripts

| Comando | Descripción |
|---|---|
| `npm start` | Servidor de desarrollo |
| `npm run build` | Build de producción en `dist/` |
| `npm test` | Tests con Vitest |
| `npm run watch` | Build en modo watch |

## Estructura

```
src/app
├── core
│   ├── guards        # auth-guard, admin-guard
│   ├── interceptors  # adjunta el JWT
│   ├── models        # tipos de la API
│   └── services      # AuthService (signals + localStorage)
├── features
│   ├── auth          # login, register, verify-otp
│   └── dashboard     # student, admin
├── shared
└── app.routes.ts
```

## Flujo de autenticación

1. `POST /auth/register` → crea el estudiante y envía el OTP por correo.
2. Pantalla `verify-otp` → el estudiante introduce el código de 6 dígitos.
3. `POST /auth/login` → devuelve el JWT y los datos del usuario.
4. El token se guarda en `localStorage` (`ca_access_token`) y se envía como `Bearer` en cada petición.
5. `authGuard` / `adminGuard` protegen las rutas según el rol.

## Flujo de aprendizaje

- **Estudiante:** abre un módulo y avanza en orden por las 3 teorías. Cada teoría tiene contenido y una pregunta de comprensión; al acertar se desbloquea la siguiente. Al completar las 3, se habilita la práctica (cuestionario de un solo intento). El backend corrige, guarda la nota y bloquea todas las sesiones.
- **Administrador:** en `Módulos → Contenido y preguntas` redacta el texto de cada teoría, su pregunta de comprensión y las preguntas de la práctica (enunciado, opciones y cuál es la correcta). Ya no se registran notas a mano.
