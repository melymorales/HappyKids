-- Pruebas de permisos de la fase 2 (ejecutar bloque por bloque en el SQL Editor).
-- Reemplaza UUID-EMPLEADO y UUID-ADMIN por los de tus usuarios (Authentication > Users).
-- Cada bloque termina en ROLLBACK: no deja ningún cambio.

-- 1) Una empleada solo ve su propio perfil. Resultado esperado: 1 fila.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select id, rol from public.perfiles;
rollback;

-- 2) Una empleada NO puede cambiarse el rol. Resultado esperado: 0 filas.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
update public.perfiles set rol = 'admin' where id = 'UUID-EMPLEADO' returning id;
rollback;

-- 3) La administradora ve todos los perfiles. Resultado esperado: 2 filas o más.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select id, rol from public.perfiles;
rollback;

-- 4) No se puede dejar el sistema sin administradora activa (si solo hay una).
--    Resultado esperado: error "Debe existir al menos una administradora activa."
begin;
update public.perfiles set activo = false where id = 'UUID-ADMIN';
rollback;
