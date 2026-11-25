# Descubrir los módulos antes de registrarse

- Navegación pública compartida de portada y catálogo: «Explorar módulos»,
  «Crear cuenta» e «Iniciar sesión», con altura mínima de 44 px y texto de 14 px.
- Superficie oscura opaca para que el video no reduzca el contraste.
  Catálogo con fondo oscuro y borde visible, registro con texto claro y login
  lavanda; sin brillos nuevos. Foco visible y estado actual del catálogo.
- En móvil el catálogo ocupa una fila y registro/login comparten la siguiente:
  no se oculta ninguna acción. Con sesión se conserva «Ir a mi panel» por rol.
- Encabezado del catálogo: «Descubre lo que aprenderás», seguido de los beneficios
  y el formato de aprendizaje. Temas y descripciones siguen disponibles sin cuenta.
- Ajuste del título de portada y de la cuadrícula de catálogo para evitar recortes
  en pantallas de 320 px, sin cambiar el contenido ni las rutas.

Pruebas unitarias de navegación anónima, roles, temas, error y catálogo vacío.
QA real en Edge headless con API simulada a 1365, 1024, 900, 768, 390 y 320 px:
acciones visibles y de al menos 44 px, navegación al catálogo mediante teclado,
estado aria-current y contenido sin cuenta. Contraste de las acciones superior a
11:1; sin errores de ejecución ni desbordamiento horizontal de la página.

Solo frontend: no requiere SQL ni cambios del backend. La navegación y el
catálogo mantienen su comportamiento de autenticación existente.
