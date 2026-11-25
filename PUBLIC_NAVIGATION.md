# Descubrir los módulos antes de registrarse

- Navegación pública compartida de portada y catálogo: «Crear cuenta» e
  «Iniciar sesión», con altura mínima de 44 px y texto de 14 px.
- Sin franja, fondo ni borde en el contenedor de navegación: el logo y los
  accesos quedan directamente sobre el fondo de la página. Se conserva el texto
  claro de registro, el login lavanda y el foco visible.
- El acceso «Explorar módulos» permanece únicamente en la llamada principal
  de la portada, debajo del texto de presentación, no duplicado en la navegación.
- En móvil registro/login comparten una fila y no se oculta ninguna acción.
  Con sesión se conserva «Ir a mi panel» por rol.
- Encabezado del catálogo: «Descubre lo que aprenderás», seguido de los beneficios
  y el formato de aprendizaje. Temas y descripciones siguen disponibles sin cuenta.
- Ajuste del título de portada y de la cuadrícula de catálogo para evitar recortes
  en pantallas de 320 px, sin cambiar el contenido ni las rutas.

Pruebas unitarias de navegación anónima, roles, temas, error y catálogo vacío.
La revisión anterior incorporó una franja opaca; se retira a petición del usuario.
La legibilidad del registro sin fondo depende de la imagen o el fotograma que tenga
detrás: ya no se afirma el contraste uniforme medido sobre aquella franja.
QA de esta corrección en Edge a 1365, 768, 390 y 320 px: contenedor transparente
sin borde, dos accesos arriba, un único enlace de módulos debajo de la presentación,
sin desbordamiento horizontal y acceso al catálogo por teclado.

Solo frontend: no requiere SQL ni cambios del backend. La navegación y el
catálogo mantienen su comportamiento de autenticación existente.
