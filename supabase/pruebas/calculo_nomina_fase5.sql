-- Pruebas de la fase 5: cálculos a mano y permisos (ejecutar bloque por bloque en el SQL Editor).
-- Reemplaza:
--   UUID-ADMIN              -> Authentication > Users > User UID de la administradora
--   UUID-EMPLEADO           -> Authentication > Users > User UID del empleado de prueba
--   UUID-REGISTRO-EMPLEADO  -> Table Editor > empleados > id del empleado de prueba
-- Todos los bloques terminan en ROLLBACK: no dejan ningún cambio en tus datos.
-- Se usa la quincena del 1 al 15 de septiembre de 2026 (ya terminada).

-- ============ CÁLCULOS A MANO ============

-- 1) POR HORA. Tarifa: 2000 por hora.
--    Día 1: 07:00 a 15:00 = 480 min. Día 2: 08:00 a 12:30 = 270 min. Total 750 min = 12,5 horas.
--    12,5 h x 2000 = 25000.   Resultado esperado: minutos_trabajados = 750, monto_crc = 25000.
begin;
delete from public.tarifas_empleado where empleado_id = 'UUID-REGISTRO-EMPLEADO';
insert into public.tarifas_empleado (empleado_id, modalidad_pago, tarifa_crc, vigente_desde)
values ('UUID-REGISTRO-EMPLEADO', 'por_hora', 2000, '2026-01-01');
update public.empleados set fecha_ingreso = '2026-01-01' where id = 'UUID-REGISTRO-EMPLEADO';
insert into public.marcas_asistencia (empleado_id, tipo, marcada_en, ip_origen, bandera_ubicacion) values
  ('UUID-REGISTRO-EMPLEADO', 'entrada', '2026-09-02 07:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'salida',  '2026-09-02 15:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'entrada', '2026-09-03 08:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'salida',  '2026-09-03 12:30:00-06', '1.1.1.1', 'ok');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select nombre_completo, modalidad_pago, tarifa_crc, minutos_trabajados, monto_crc, advertencia
from public.calcular_nomina('2026-09-01', '2026-09-15')
where empleado_id = 'UUID-REGISTRO-EMPLEADO';
rollback;

-- 1b) POR HORA con redondeo. Tarifa: 2500 por hora, 7 horas y 5 minutos (425 min).
--     425 x 2500 / 60 = 17708,33... se redondea al colón: 17708.   Resultado esperado: monto_crc = 17708.
begin;
delete from public.tarifas_empleado where empleado_id = 'UUID-REGISTRO-EMPLEADO';
insert into public.tarifas_empleado (empleado_id, modalidad_pago, tarifa_crc, vigente_desde)
values ('UUID-REGISTRO-EMPLEADO', 'por_hora', 2500, '2026-01-01');
update public.empleados set fecha_ingreso = '2026-01-01' where id = 'UUID-REGISTRO-EMPLEADO';
insert into public.marcas_asistencia (empleado_id, tipo, marcada_en, ip_origen, bandera_ubicacion) values
  ('UUID-REGISTRO-EMPLEADO', 'entrada', '2026-09-02 07:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'salida',  '2026-09-02 14:05:00-06', '1.1.1.1', 'ok');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select minutos_trabajados, monto_crc
from public.calcular_nomina('2026-09-01', '2026-09-15')
where empleado_id = 'UUID-REGISTRO-EMPLEADO';
rollback;

-- 2) SALARIO FIJO POR QUINCENA. Tarifa: 150000. Sin marcas de asistencia.
--    Se paga completa.   Resultado esperado: monto_crc = 150000.
begin;
delete from public.tarifas_empleado where empleado_id = 'UUID-REGISTRO-EMPLEADO';
insert into public.tarifas_empleado (empleado_id, modalidad_pago, tarifa_crc, vigente_desde)
values ('UUID-REGISTRO-EMPLEADO', 'quincena_fija', 150000, '2026-01-01');
update public.empleados set fecha_ingreso = '2026-01-01' where id = 'UUID-REGISTRO-EMPLEADO';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select modalidad_pago, minutos_trabajados, monto_crc, advertencia
from public.calcular_nomina('2026-09-01', '2026-09-15')
where empleado_id = 'UUID-REGISTRO-EMPLEADO';
rollback;

-- 3) POR GRUPO. Tarifa: 5000 por grupo. 12 grupos en la quincena (5 + 4 + 3).
--    12 x 5000 = 60000.   Resultado esperado: cantidad_grupos = 12, monto_crc = 60000.
begin;
delete from public.tarifas_empleado where empleado_id = 'UUID-REGISTRO-EMPLEADO';
insert into public.tarifas_empleado (empleado_id, modalidad_pago, tarifa_crc, vigente_desde)
values ('UUID-REGISTRO-EMPLEADO', 'por_grupo', 5000, '2026-01-01');
update public.empleados set fecha_ingreso = '2026-01-01' where id = 'UUID-REGISTRO-EMPLEADO';
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.registrar_grupos('UUID-REGISTRO-EMPLEADO', '2026-09-02', 5);
select public.registrar_grupos('UUID-REGISTRO-EMPLEADO', '2026-09-03', 4);
select public.registrar_grupos('UUID-REGISTRO-EMPLEADO', '2026-09-04', 3);
select cantidad_grupos, monto_crc
from public.calcular_nomina('2026-09-01', '2026-09-15')
where empleado_id = 'UUID-REGISTRO-EMPLEADO';
rollback;

-- 4) CAMBIO DE TARIFA a media quincena (por hora). 2000 hasta el 8 de septiembre y 3000 desde el 9.
--    Día 8: 4 h (240 min) a 2000 = 8000. Día 9: 4 h (240 min) a 3000 = 12000. Total 20000.
--    Resultado esperado: monto_crc = 20000 y una advertencia de que la tarifa cambió.
begin;
delete from public.tarifas_empleado where empleado_id = 'UUID-REGISTRO-EMPLEADO';
insert into public.tarifas_empleado (empleado_id, modalidad_pago, tarifa_crc, vigente_desde, vigente_hasta) values
  ('UUID-REGISTRO-EMPLEADO', 'por_hora', 2000, '2026-01-01', '2026-09-09'),
  ('UUID-REGISTRO-EMPLEADO', 'por_hora', 3000, '2026-09-09', null);
update public.empleados set fecha_ingreso = '2026-01-01' where id = 'UUID-REGISTRO-EMPLEADO';
insert into public.marcas_asistencia (empleado_id, tipo, marcada_en, ip_origen, bandera_ubicacion) values
  ('UUID-REGISTRO-EMPLEADO', 'entrada', '2026-09-08 08:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'salida',  '2026-09-08 12:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'entrada', '2026-09-09 08:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'salida',  '2026-09-09 12:00:00-06', '1.1.1.1', 'ok');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select minutos_trabajados, monto_crc, advertencia
from public.calcular_nomina('2026-09-01', '2026-09-15')
where empleado_id = 'UUID-REGISTRO-EMPLEADO';
rollback;

-- ============ GUARDAR, PAGAR Y PERMISOS ============

-- 5) Guardar una quincena, intentar guardar otra que se cruza, y marcar pagos.
--    Resultado esperado: 1) se guarda; 2) error "Ya existe una quincena guardada que se cruza con estas fechas.";
--    3) el pago queda en estado "pagada".
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.guardar_periodo_nomina('2026-09-01', '2026-09-15');
select * from public.periodos_resumen;
select public.marcar_periodo_pagado((select id from public.periodos_nomina limit 1));
select estado, pagada_en from public.detalle_nomina limit 3;
rollback;

begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.guardar_periodo_nomina('2026-09-01', '2026-09-15');
select public.guardar_periodo_nomina('2026-09-10', '2026-09-20');
rollback;

-- 6) No se puede guardar una quincena que todavía no termina.
--    Resultado esperado: error "La quincena todavía no termina..."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.guardar_periodo_nomina(current_date - 3, current_date);
rollback;

-- 7) Una quincena guardada no se puede modificar, ni siquiera desde el SQL Editor.
--    Resultado esperado: error "El cálculo de una quincena guardada no se puede modificar."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.guardar_periodo_nomina('2026-09-01', '2026-09-15');
reset role;
update public.detalle_nomina set monto_crc = 1;
rollback;

-- 8) Una empleada NO puede calcular ni guardar nómina.
--    Resultado esperado: error "No tienes permiso para esta acción."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select * from public.calcular_nomina('2026-09-01', '2026-09-15');
rollback;

-- 9) Una empleada solo ve su propia nómina guardada.
--    Resultado esperado: solo filas con el nombre de la empleada de prueba (y sin la columna de advertencias).
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.guardar_periodo_nomina('2026-09-01', '2026-09-15');
reset role;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select nombre_completo, monto_crc, estado, advertencias from public.nomina_detalle;
rollback;

-- 10) No se pueden cambiar los grupos de una fecha que ya está en una quincena guardada.
--     Resultado esperado: error "Esa fecha pertenece a una quincena ya guardada y no se puede cambiar."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.guardar_periodo_nomina('2026-09-01', '2026-09-15');
select public.registrar_grupos('UUID-REGISTRO-EMPLEADO', '2026-09-05', 3);
rollback;
