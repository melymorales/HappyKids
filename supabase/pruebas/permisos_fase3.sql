-- Pruebas de permisos de la fase 3 (ejecutar bloque por bloque en el SQL Editor).
-- Reemplaza UUID-EMPLEADO, UUID-ADMIN y UUID-REGISTRO-EMPLEADO:
--   * UUID-EMPLEADO y UUID-ADMIN: Authentication > Users (columna User UID).
--   * UUID-REGISTRO-EMPLEADO: Table Editor > empleados > columna id del empleado de prueba.
-- Cada bloque termina en ROLLBACK: no deja ningún cambio.

-- 1) Un empleado solo ve su propio resumen. Resultado esperado: 1 fila.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select id, nombre_completo, puesto from public.empleados_resumen;
rollback;

-- 2) Un empleado NO puede modificar empleados. Resultado esperado: error "permission denied".
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
update public.empleados set puesto = 'Hackeado' where id = 'UUID-REGISTRO-EMPLEADO';
rollback;

-- 3) Un empleado NO puede agregarse una tarifa. Resultado esperado: error "No tienes permiso para esta acción."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select public.agregar_tarifa('UUID-REGISTRO-EMPLEADO', 'por_hora', 99999, current_date + 1);
rollback;

-- 4) Un empleado NO ve la bitácora. Resultado esperado: 0 filas.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select * from public.bitacora_auditoria;
rollback;

-- 5) La administradora ve todos los empleados. Resultado esperado: todas las filas.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select id, nombre_completo, tarifa_crc from public.empleados_resumen;
rollback;

-- 6) La administradora agrega una tarifa nueva y la anterior se cierra.
--    Resultado esperado: 2 filas; la primera con vigente_hasta = mañana, la segunda sin fecha de fin.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.agregar_tarifa('UUID-REGISTRO-EMPLEADO', 'por_hora', 3500, current_date + 1);
select vigente_desde, vigente_hasta, tarifa_crc
from public.tarifas_empleado
where empleado_id = 'UUID-REGISTRO-EMPLEADO'
order by vigente_desde;
rollback;
