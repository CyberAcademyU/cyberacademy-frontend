# Publicar «Continuar con Google»

1. Aplicar `V12__google_identity.sql` en la base de datos del backend **antes de desplegarlo**. Flyway está desactivado. La columna es opcional para las cuentas existentes.
2. El backend tiene configurado el ID público de **CyberAcademy Web Login**. Para otro entorno se puede definir `GOOGLE_WEB_CLIENT_ID`. No se usa secreto OAuth ni `GEMINI_API_KEY`.
3. En Google Auth Platform, autorizar cada origen exacto que muestra el botón (incluido el puerto en local). En modo de prueba, agregar las cuentas de prueba en Público.
4. En el sitio estático de Render, si hay una política CSP, ampliar sus directivas existentes: `script-src` con `https://accounts.google.com/gsi/client`, `style-src` con `https://accounts.google.com/gsi/style`, y `connect-src` y `frame-src` con `https://accounts.google.com/gsi/`. Para ventanas emergentes sin FedCM, usar `Cross-Origin-Opener-Policy: same-origin-allow-popups` en el **frontend**. Revisar la consola del navegador; no desactivar CSP.
5. Desplegar backend, luego frontend. Probar con una cuenta nueva, una ya vinculada y una cuenta previa con contraseña. Para esta última, entrar primero con contraseña y elegir **Perfil → Cuenta y seguridad → Vincular mi cuenta de Google**.

Para probar en localhost, servir también el backend en localhost y verificar la URL de API de desarrollo: las cookies `SameSite=Strict` no se comparten entre localhost y el dominio de producción.
