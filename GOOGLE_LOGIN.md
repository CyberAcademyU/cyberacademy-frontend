# Publicar «Continuar con Google»

1. Aplicar `V12__google_identity.sql` en la base de datos del backend **antes de desplegarlo**. Flyway está desactivado. La columna es opcional para las cuentas existentes.
2. El backend tiene configurado el ID público de **CyberAcademy Web Login**. Para otro entorno se puede definir `GOOGLE_WEB_CLIENT_ID`. No se usa secreto OAuth ni `GEMINI_API_KEY`.
3. En Google Auth Platform, autorizar cada origen exacto que muestra el botón (incluido el puerto en local). En modo de prueba, agregar las cuentas de prueba en Público.
4. En el sitio estático de Render, si hay una política CSP, ampliar sus directivas existentes: `script-src` con `https://accounts.google.com/gsi/client`, `style-src` con `https://accounts.google.com/gsi/style`, y `connect-src` y `frame-src` con `https://accounts.google.com/gsi/`. Para ventanas emergentes sin FedCM, usar `Cross-Origin-Opener-Policy: same-origin-allow-popups` en el **frontend**. Revisar la consola del navegador; no desactivar CSP.
5. Desplegar backend, luego frontend. Probar con una cuenta nueva, una ya vinculada y una cuenta previa con contraseña. Para esta última, entrar primero con contraseña y elegir **Perfil → Cuenta y seguridad → Vincular mi cuenta de Google**.

Para probar en localhost, servir también el backend en localhost y verificar la URL de API de desarrollo: las cookies `SameSite=Strict` no se comparten entre localhost y el dominio de producción.

## Regreso tras inactividad

- El desafío conserva su límite de 600 segundos en el backend. La SPA considera
  vencida su configuración a los 8 minutos y la renueva solo mientras el botón
  está montado, visible y no está validando una credencial.
- También comprueba la vigencia al recuperar foco, visibilidad o una página
  restaurada por el navegador. No se necesita recargar manualmente.
- El coordinador global reutiliza una configuración vigente entre registro,
  login y vinculación; deduplica peticiones pendientes y evita reinicializar GIS
  por cada montaje o cambio de tamaño.
- Un desafío consumido se invalida. Un 401 prepara otro intento sin reenviar
  automáticamente la credencial rechazada. Si otra pestaña sustituyó la cookie
  o el popup estuvo abierto demasiado tiempo, puede ser necesario seleccionar
  la cuenta nuevamente. Nunca se omite la validación de nonce.
- El registro que pide nombres conserva su credencial solo en memoria y no
  renueva la cookie mientras el formulario utiliza esa credencial.
- Callbacks obsoletos se ignoran; listeners, suscripciones y temporizadores del
  botón se liberan al destruirlo.

### Consola y comprobación manual

No se intercepta ni se oculta la consola. GIS puede advertir de otra inicialización
cuando se reemplaza legítimamente un desafío vencido: no se promete una consola
vacía. `ERR_BLOCKED_BY_CLIENT` en logs de Google depende del bloqueador del navegador.
Los 401 de restauración de una sesión expirada son independientes del login Google.
No se han relajado cookies, CSP ni cabeceras del backend.

Probar en el dominio autorizado: entrar tras dejar el login más de diez minutos,
volver de una pestaña oculta, alternar registro/login, cerrar sesión y volver a entrar,
vincular desde el perfil y registrar una cuenta nueva con nombres confirmados.
La autenticación real de Google requiere comprobación manual; los tests automatizados
simulan GIS, el reloj, respuestas tardías y errores del backend.
