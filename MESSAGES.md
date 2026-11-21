# Mensajes: interfaz y publicación

Requiere aplicar **V14__student_messages.sql** y publicar el backend antes del frontend.
No hacen falta claves, correo externo ni nuevas conexiones WebSocket.

- Administrador: menú **Enviar mensaje**, escoger todos los estudiantes activos o
  estudiantes específicos. Buscar nombre/correo, seleccionar hasta 500, escribir
  máximo 2000 caracteres y revisar la vista previa. Solo Confirmar y enviar hace el envío.
  Los reintentos desde la misma confirmación conservan el UUID para evitar duplicados.
- Estudiante: enlace **Mensajes** e icono de sobre con contador de no leídos.
  Bandeja paginada, botón Leer mensaje, eliminación individual y vaciado con confirmación.
- Aviso oscuro con borde lavanda, icono de sobre, nombre/apellido y vista breve del texto.
  Esquina superior derecha en escritorio y parte superior en móvil, respetando safe area.
  Dura 3 segundos; el contenido permanece en la bandeja. No desplaza el foco ni bloquea
  el resto de la interfaz.
- Consulta cada 15 segundos solo para estudiantes autenticados en pestaña visible.
  Pausa el aviso cuando la pestaña se oculta y limpia el estado al cerrar sesión.
  No hay recepción ni bandeja para administradores; el backend lo impide además del guard.
- Contenido renderizado mediante interpolación Angular, nunca innerHTML.

Probar después de publicar: enviar a uno, a varios y a todos; verificar que un
estudiante no seleccionado y otro administrador no reciban nada; revisar duración,
contador, lectura, borrado individual y vaciado en dos cuentas diferentes.
Probar escritorio y teléfono, una pestaña oculta, recarga y cierre de sesión.
