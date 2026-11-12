# CyberAcademy — Frontend

Aplicación web de **CyberAcademy** construida con Angular 22 (standalone components + signals). Consume la API REST del backend bajo `/api/v1`.

## Stack

| Tecnología | Versión |
|---|---|
| Angular | 22 |
| TypeScript | 6.0 |
| RxJS | 7.8 |
| Vitest | 5 |
| Prettier | 3 |

## Requisitos

- Node.js 22.22.3 o superior dentro de la rama 22 (por ejemplo, 22.23.2)
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

La configuración de producción apunta al backend de Render. Si cambia su URL, actualiza `environment.ts` y vuelve a compilar.

> El backend debe permitir el origen del frontend en `CORS_ALLOWED_ORIGINS`.

### Despliegue como Static Site en Render

1. En Render, crea un **Static Site** desde el repositorio `CyberAcademyU/cyberacademy-frontend`, rama `develop`.
2. Usa `npm ci && npm run build` como comando de compilación y `dist/frontend/browser` como directorio de publicación.
3. Configura `NODE_VERSION=22.23.2` en las variables de entorno del sitio estático.
4. En **Redirects/Rewrites**, agrega una regla de tipo **Rewrite** con origen `/*` y destino `/index.html` para las rutas de Angular.
5. En el servicio backend, agrega el origen HTTPS exacto del sitio generado a `CORS_ALLOWED_ORIGINS`, separado por comas de los orígenes existentes, sin barra final. Guarda y espera el redespliegue.
6. Comprueba que el sitio abra, que `/auth/login` funcione al recargar y que el registro, el correo OTP y el inicio de sesión funcionen desde el dominio publicado.

El sitio y el backend son servicios separados. No pongas secretos ni credenciales en las variables del frontend ni en `src/environments/`: se distribuyen al navegador.

### App Android personal (Capacitor)

El frontend también se empaqueta como app Android con [Capacitor](https://capacitorjs.com/). Es una app de uso personal: usa los archivos compilados dentro del WebView y consume el mismo backend de Render. No se publica en ninguna tienda.

El proyecto nativo vive en `android/` y se configura en `capacitor.config.ts`:

- `appId`: `com.cyberacademy.app`
- `webDir`: `dist/frontend/browser` (no cambies `outputPath` en `angular.json` sin actualizar esto)
- `server.androidScheme: 'https'` → el WebView carga la app con origen `https://localhost`

Ese origen debe estar en `CORS_ALLOWED_ORIGINS` del backend (junto a `capacitor://localhost` por si algún día se compila para iOS). Sin él, el login devuelve `403` en el preflight.

**Requisitos**

- JDK 21 (`JAVA_HOME`)
- Android SDK con platform 35+ y build-tools (`ANDROID_HOME` / `ANDROID_SDK_ROOT`)
- `android/local.properties` con `sdk.dir` (está ignorado por Git)

**Compilar e instalar**

```bash
npm install
npm run cap:sync     # ng build + cap sync android
cd android

# Windows PowerShell: apunta al SDK y al JDK antes de compilar
$env:JAVA_HOME='C:\Program Files\Java\jdk-21.0.12'
$env:ANDROID_HOME="$env:LOCALAPPDATA\Android\Sdk"
$env:ANDROID_SDK_ROOT=$env:ANDROID_HOME
.\gradlew.bat assembleDebug
```

El APK queda en `android/app/build/outputs/apk/debug/app-debug.apk`. Para instalarlo con el teléfono conectado por USB y depuración activada:

```bash
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

También puedes copiar el APK al teléfono y abrirlo, habilitando antes la instalación de apps de origen desconocido.

**Iconos y splash**

Los recursos fuente están en `assets/` (SVG y PNG). Tras cambiarlos:

```bash
npx capacitor-assets generate --android \
  --iconBackgroundColor "#070709" --iconBackgroundColorDark "#070709" \
  --splashBackgroundColor "#070709" --splashBackgroundColorDark "#070709"
```

`assets/icon-only.png` se usa para el icono legacy y `assets/icon-foreground.png` (con transparencia) para el adaptativo. El fondo del icono adaptativo se define como color en `android/app/src/main/res/values/ic_launcher_background.xml`.

**Notas**

- Cualquier cambio en el código Angular requiere `npm run cap:sync` y recompilar el APK.
- El backend Free duerme tras un periodo de inactividad y tarda ~3 minutos en responder: la primera acción tras abrir la app puede tardar. El primer arranque muestra el splash mientras Angular carga.
- El APK de depuración (`debug`) se firma con la clave de depuración del equipo, suficiente para uso personal. No lo distribuyas.

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
| `npm run cap:sync` | Build de producción + copia los assets al proyecto Android |
| `npm run cap:open` | Abre el proyecto Android en Android Studio |

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
