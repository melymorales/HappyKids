-- Pruebas de la fase 4B (ejecutar bloque por bloque en el SQL Editor).
-- Reemplaza UUID-EMPLEADO y UUID-ADMIN por los de tus usuarios (Authentication > Users > User UID),
-- y UUID-REGISTRO-EMPLEADO por el id del empleado de prueba (Table Editor > empleados > id).
-- Cada bloque termina en ROLLBACK: no deja ningún cambio.

-- 1) La empleada pide agregar una salida olvidada. Queda PENDIENTE.
--    Resultado esperado: una fila con estado "pendiente".
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select public.solicitar_correccion('agregar', 'Olvidé marcar mi salida', null, null, 'salida', now() - interval '3 hours');
select tipo, estado, motivo from public.correcciones_marca;
rollback;

-- 2) Una empleada NO puede resolver correcciones.
--    Resultado esperado: error "No tienes permiso para esta acción."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select public.solicitar_correccion('agregar', 'Olvidé marcar mi salida', null, null, 'salida', now() - interval '3 hours');
select public.resolver_correccion((select id from public.correcciones_marca limit 1), true, null);
rollback;

-- 3) Flujo completo: la empleada pide entrada y salida de ayer, la administradora aprueba
--    y las horas se calculan. Resultado esperado: minutos = 480 (8 horas) y incompleta = false.
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select public.solicitar_correccion('agregar', 'Olvidé marcar la entrada', null, null, 'entrada',
  (((now() at time zone 'America/Costa_Rica')::date - 1)::timestamp + time '07:00') at time zone 'America/Costa_Rica');
select public.solicitar_correccion('agregar', 'Olvidé marcar la salida', null, null, 'salida',
  (((now() at time zone 'America/Costa_Rica')::date - 1)::timestamp + time '15:00') at time zone 'America/Costa_Rica');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.resolver_correccion(id, true, 'Aprobada') from public.correcciones_marca where estado = 'pendiente';
select * from public.jornadas(current_date - 2, current_date, 'UUID-REGISTRO-EMPLEADO');
rollback;

-- 4) Una corrección ya resuelta no se puede modificar, ni siquiera desde el SQL Editor.
--    Resultado esperado: error "Una corrección ya resuelta no se puede modificar."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.solicitar_correccion('agregar', 'Registrada por la administradora', 'UUID-REGISTRO-EMPLEADO', null, 'entrada', now() - interval '5 hours');
reset role;
update public.correcciones_marca set motivo = 'Cambio indebido';
rollback;

-- 5) Una marca anulada deja de contar. Resultado esperado: antes 1 fila, después 0 filas.
begin;
insert into public.ips_permitidas (etiqueta, red) values ('Prueba', '203.0.113.5/32');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select set_config('request.headers', '{"cf-connecting-ip":"203.0.113.5"}', true);
select public.registrar_marca('entrada');
select count(*) as antes from public.marcas_efectivas;
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.revisar_marca((select id from public.marcas_asistencia order by marcada_en desc limit 1), false, 'Marca hecha por error');
select count(*) as despues from public.marcas_efectivas;
rollback;

-- 6) Una empleada no puede revisar marcas. Resultado esperado: error "No tienes permiso para esta acción."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select public.revisar_marca(gen_random_uuid(), true, null);
rollback;

-- 7) Las alertas son solo para la administradora. Resultado esperado: error "No tienes permiso para esta acción."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select * from public.alertas_asistencia(current_date - 7, current_date);
rollback;
