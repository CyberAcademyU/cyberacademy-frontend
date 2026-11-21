# Nombres confirmados en registro Google

Publicar primero este frontend y después el backend correspondiente. El frontend
es compatible con el endpoint anterior; el backend nuevo exige completar nombres
para cuentas nuevas. No necesita SQL.

Flujo: seleccionar Google → backend verifica credencial y nonce → si la cuenta
es nueva devuelve 428 sin crear usuario ni sesión → formulario de nombres y
apellidos vacíos → Crear mi cuenta vuelve a verificar la credencial y el nonce,
valida los nombres y crea la cuenta STUDENT con esos datos.

Las cuentas existentes entran como antes, sin pedir nombres ni cambiarlos.
La vinculación desde perfil tampoco renombra usuarios.

La credencial pendiente se conserva solo en memoria de AuthService, nunca en
localStorage, URL o estado del historial. Se borra al terminar, cancelar, abandonar
la pantalla o cerrar sesión. Una recarga obliga a seleccionar Google de nuevo.
La cookie HttpOnly del challenge se conserva durante el paso intermedio (hasta
su caducidad normal) y se limpia tras el éxito, igual que antes.

Probar con Google real tras publicar: cuenta nueva, nombres con tildes/apellidos
compuestos, cancelar sin crear usuario, recargar paso intermedio, cuenta existente
y vinculación sin perder sus nombres/progreso.
