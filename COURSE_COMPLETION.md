# Felicitación al finalizar el recorrido

- Mensaje persistente en la cabecera del panel del estudiante, sin emojis,
  confeti, notificaciones temporales ni ventanas que interrumpan.
- Conserva el diseño de CyberAcademy y el resumen de avance. Incluye acceso
  a «Ver mis resultados».
- Se muestra con un catálogo no vacío, cargado sin errores, cuando todos
  los módulos tienen sus secciones finalizadas y una práctica terminal.
- Completar no significa aprobar: un resultado FAILED solo cuenta como finalizado
  si ya agotó sus intentos. No se afirma que aprobó todo ni que obtuvo un certificado.
- El anuncio de nuevos contenidos, módulos y certificación está expresado como
  futuro. No genera ni ofrece descargar certificados.
- Aparece para quienes ya terminaron y se actualiza con el progreso de la última
  práctica. Si llega un módulo nuevo pendiente, vuelve a mostrar el siguiente paso.
- Sin cambios de API ni migraciones. Publicación solo del frontend.

Verificación: pruebas de catálogo vacío, carga, error, recorrido parcial/finalizado,
práctica terminal, nuevo módulo, texto sin emojis y botón de resultados. Vista real
en Edge headless con API simulada a 1365, 768, 390 y 320 px, sin desbordamientos
ni errores de ejecución. No se utilizó ninguna cuenta o dato real.

El detector visual solo señaló dos bordes preexistentes en la retroalimentación
de actividades y resultados; se conservaron por estar fuera de este cambio.
