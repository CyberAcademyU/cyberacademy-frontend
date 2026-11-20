# Publicar fotos de perfil

1. Aplicar manualmente **V13__profile_photos.sql** del backend. Flyway está desactivado.
2. Publicar el backend con los endpoints `/profile/photo`, `/profile/avatar` y `/profile/photos/{version}`.
3. Publicar este frontend. No hacen falta claves externas ni buckets públicos.

- STUDENT: en **Mi perfil → Editar perfil → Foto de perfil**, subir/cambiar/quitar foto
  o seleccionar uno de los ocho avatares. Los cambios de imagen se guardan al momento;
  «Guardar cambios» guarda los demás datos sin revertir la foto/avatar actual.
- ADMIN: en **Mi perfil → Cuenta y seguridad → Foto de perfil**, subir/cambiar/quitar
  foto; no hay catálogo de avatares ni edición de datos generales.

Solo JPG/PNG hasta 2 MB. Se recortan al centro y se guardan en 256×256 sin metadatos.
Los cambios actualizan el perfil compartido, incluida la cabecera, sin recargar.
La administración muestra la imagen en listado y detalle de estudiantes; la clasificación
muestra fotos o avatares de estudiantes visibles.

Las imágenes se sirven desde el backend con cookies de sesión y permisos. La CSP del frontend
debe permitir `https://backend.migueltalavera.site` en `img-src` (la política documentada
con `img-src 'self' https: data:` ya lo permite). No cambiar SameSite para probar localhost:
usar ambos servicios localmente o ambos en el dominio publicado.

Prueba visual manual pendiente en el entorno desplegado después de aplicar V13:
subida, reemplazo y borrado, retorno a avatar, perfil administrador vacío,
listado/detalle y clasificación en escritorio y móvil.
