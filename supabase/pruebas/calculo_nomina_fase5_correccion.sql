-- Prueba de la corrección: horas en días sin tarifa vigente (ejecutar bloque por bloque).
-- Reemplaza UUID-ADMIN y UUID-REGISTRO-EMPLEADO como en el archivo anterior.
-- Termina en ROLLBACK: no deja ningún cambio.

-- A) La tarifa empieza el 10 de septiembre, pero hay horas desde el 2.
--    Día 2: 480 min SIN tarifa. Día 11: 200 min a 2500 por hora = 8333.
--    Resultado esperado: minutos_trabajados = 680, minutos_sin_tarifa = 480, monto_crc = 8333,
--    advertencia "Hay 8 h 00 min en días sin tarifa vigente...".
--    Y guardar la quincena debe fallar con "Hay empleados con horas en días sin tarifa vigente...".
-- B) Al adelantar la fecha de ingreso al 1 de septiembre, la tarifa empieza ese día.
--    Resultado esperado: minutos_sin_tarifa = 0 y monto_crc = 680 x 2500 / 60 = 28333.
begin;
delete from public.tarifas_empleado where empleado_id = 'UUID-REGISTRO-EMPLEADO';
insert into public.tarifas_empleado (empleado_id, modalidad_pago, tarifa_crc, vigente_desde)
values ('UUID-REGISTRO-EMPLEADO', 'por_hora', 2500, '2026-09-10');
update public.empleados set fecha_ingreso = '2026-09-10' where id = 'UUID-REGISTRO-EMPLEADO';
insert into public.marcas_asistencia (empleado_id, tipo, marcada_en, ip_origen, bandera_ubicacion) values
  ('UUID-REGISTRO-EMPLEADO', 'entrada', '2026-09-02 07:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'salida',  '2026-09-02 15:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'entrada', '2026-09-11 08:00:00-06', '1.1.1.1', 'ok'),
  ('UUID-REGISTRO-EMPLEADO', 'salida',  '2026-09-11 11:20:00-06', '1.1.1.1', 'ok');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);

-- A) antes de corregir
select minutos_trabajados, minutos_sin_tarifa, monto_crc, advertencia
from public.calcular_nomina('2026-09-01', '2026-09-15')
where empleado_id = 'UUID-REGISTRO-EMPLEADO';

-- (esta línea debe dar error; si la ejecutas, el bloque se aborta: ejecútala aparte si quieres verla)
-- select public.guardar_periodo_nomina('2026-09-01', '2026-09-15');

-- B) corregir la fecha de ingreso y volver a calcular
select public.actualizar_empleado(
  'UUID-REGISTRO-EMPLEADO',
  (select nombre_completo from public.empleados_resumen where id = 'UUID-REGISTRO-EMPLEADO'),
  (select puesto from public.empleados_resumen where id = 'UUID-REGISTRO-EMPLEADO'),
  '2026-09-01',
  null
);
select minutos_trabajados, minutos_sin_tarifa, monto_crc, advertencia
from public.calcular_nomina('2026-09-01', '2026-09-15')
where empleado_id = 'UUID-REGISTRO-EMPLEADO';
rollback;
