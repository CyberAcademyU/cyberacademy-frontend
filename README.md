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

### Imágenes y video en una teoría

El administrador puede añadir hasta dos imágenes y un video a cada teoría:

1. En el panel de administración, entra en **Módulos** y pulsa **Editar contenido** en el módulo correspondiente.
2. En la teoría deseada, busca **Recursos de la teoría** y pega los enlaces en los campos de imagen y video. Son opcionales y deben empezar por `https://`.
3. Guarda la sesión. El estudiante verá los recursos debajo del texto de esa teoría, antes de la pregunta de comprensión. Para eliminarlos, borra sus enlaces y guarda de nuevo.

Las imágenes deben tener una URL directa a un archivo accesible por los estudiantes, no un enlace a una página que lo contiene. Usa contenido autorizado y evita enlaces privados, temporales o con credenciales. Videos de YouTube compatibles y enlaces directos a archivos `.mp4` o `.webm` se reproducen en la página; otros enlaces HTTPS se abren en una pestaña nueva. La disponibilidad, permisos de reproducción, subtítulos y accesibilidad dependen del recurso de origen. Comprueba los enlaces desde una cuenta de estudiante.

> El backend necesita las columnas de la migración `V9__theory_media.sql` antes de usar esta función; consulta el README del backend.

### Secretos y archivos locales

- No subas contraseñas, claves, tokens JWT ni archivos `.env` al repositorio. `.env` y sus variantes (como `.env.local` y `.env.production`) están ignorados por Git.
- Se permite `.env.example` únicamente como plantilla, con nombres de variables y valores de ejemplo sin credenciales reales.
- Los archivos de `src/environments/` forman parte del frontend distribuido al navegador: **nunca guardes secretos en ellos**, aunque se llamen variables de entorno.
- Antes de cada commit, revisa `git status` y `git diff --cached`. No uses `git add -f` con archivos secretos. Si un secreto ya se subió, ignorarlo después no lo elimina del historial: avisa al equipo y revócalo o rótalo.

## Flujo de trabajo con Git

Aplica estos pasos por separado en el repositorio donde trabajes:

- `master`: versión estable; se actualiza mediante Pull Request desde `develop`.
- `develop`: integración y pruebas; recibe Pull Requests desde ramas de tareas.
- `feature/descripcion` y `fix/descripcion`: ramas temporales para funcionalidades y correcciones. Cada persona crea una por tarea a partir de `develop`.

Actualiza `develop` y crea tu rama (usa un nombre descriptivo y diferente para cada tarea):

```bash
git fetch origin
git switch develop
git pull --ff-only origin develop
git switch -c feature/nombre-de-la-tarea
# Para una corrección: git switch -c fix/nombre-del-error
```

Después de implementar y probar el cambio:

```bash
git status
git add ruta/del/archivo
git diff --cached
git commit -m "feat: describir el cambio"
git push -u origin feature/nombre-de-la-tarea
```

En GitHub abre un Pull Request con **base `develop`** y como origen tu rama. Espera a que pase CI y solicita revisión a un compañero antes de fusionar. Cuando el equipo haya probado `develop`, abre otro Pull Request con **base `master`** y origen `develop`. No subas directamente a las ramas protegidas. Las ramas `feature/*` y `fix/*` se crean cuando comienza cada tarea, no de antemano.

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

- **Estudiante:** abre un módulo y avanza en orden por las 3 teorías. Cada teoría tiene contenido y una pregunta de comprensión; al acertar se desbloquea la siguiente. Al completar las 3, se habilita la práctica (cuestionario de un solo intento). El backend corrige, guarda la nota y bloquea todas las sesiones. El avance se muestra por sesiones (3 teorías = 75 %, práctica = 100 %) y el estudiante solo ve la **nota final de cada módulo**, no notas por sesión.
- **Administrador:** en `Módulos → Contenido y preguntas` redacta el texto de cada teoría, su pregunta de comprensión y las preguntas de la práctica (enunciado, opciones y cuál es la correcta). En `Estudiantes` ve la nota final de cada módulo, el total acumulado sobre los módulos activos, la nota media y el avance de cada estudiante. Ya no se registran notas a mano.
