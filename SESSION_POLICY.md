# Cierre sin avisos y sesión única

Requiere **V15 aplicada manualmente y backend actualizado antes del frontend**.
Ver `SESSION_POLICY.md` en backend para la ventana de mantenimiento.

- Tras 15 minutos sin interacción, se limpia la sesión y se vuelve al login.
  No hay modal, aviso, cuenta regresiva ni mensaje de cierre por otro dispositivo.
- Cuenta clics/taps, movimiento del puntero, teclado y desplazamiento confiables
  del navegador. Foco, polling, refresh y eventos sintéticos no cuentan.
- Actividad compartida entre pestañas mediante BroadcastChannel y storage
  (solo UUID de correlación y fecha; nunca credenciales ni datos del perfil).
- POST de actividad acotado a uno cada 15 segundos mientras hay cambios; status
  cada 30 segundos visible. Las respuestas de status no inventan actividad.
  Si un evento quedó viejo por suspensión/red, no se transforma en actividad actual.
- Al volver a una pestaña o equipo suspendido se compara el reloj antes de admitir
  interacción. Si pasó el plazo, se cierra. El backend rechaza la sesión de todas formas.
- Al recargar se usa el plazo restante del servidor, no otros 15 minutos nuevos.
- Un nuevo login invalida en backend el del otro dispositivo. En la pantalla
  anterior se detecta en su próxima petición o comprobación (hasta 30 s visible).
- Cierre entre pestañas y solicitudes tardías se acotan al ID de sesión para no
  expulsar un login nuevo. Se limpian timers y listeners al salir/cambiar de sesión.
- No se envían evaluaciones automáticamente: las respuestas no enviadas pueden
  perderse al cerrar. El progreso ya enviado permanece guardado.

Verificación automática con relojes simulados, HTTP simulado, almacenamiento entre
pestañas, inactividad, restauración y carreras con logout/login.
Validación manual pendiente en el dominio publicado con dos dispositivos.
Android requiere `npm run cap:sync` antes de crear una nueva APK.
