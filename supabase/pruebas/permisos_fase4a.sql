-- Pruebas de la fase 4A (ejecutar bloque por bloque en el SQL Editor).
-- Reemplaza UUID-EMPLEADO y UUID-ADMIN por los de tus usuarios (Authentication > Users > User UID).
-- Cada bloque termina en ROLLBACK: no deja ningún cambio.
-- Las pruebas simulan una llamada desde la red 203.0.113.5 (dirección de ejemplo).

-- 1) Marcar SIN estar en una red permitida debe rechazarse.
--    Resultado esperado: {"ok": false, "motivo": "fuera_de_red", ...}
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select set_config('request.headers', '{"cf-connecting-ip":"203.0.113.5"}', true);
select public.registrar_marca('entrada', 9.9, -83.9, 15);
rollback;

-- 2) Con la red permitida: entrada OK, segunda entrada rechazada, salida OK.
--    Resultado esperado: ok true / ok false (entrada_abierta) / ok true.
begin;
insert into public.ips_permitidas (etiqueta, red) values ('Prueba', '203.0.113.5/32');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select set_config('request.headers', '{"cf-connecting-ip":"203.0.113.5"}', true);
select public.registrar_marca('entrada', 9.9, -83.9, 15);
select public.registrar_marca('entrada', 9.9, -83.9, 15);
select public.registrar_marca('salida', 9.9, -83.9, 15);
rollback;

-- 3) Una marca lejos del kínder se guarda, pero queda señalada.
--    Resultado esperado: ok true con "bandera": "fuera_de_radio" (centro en 9.9, -83.9; marca en 10.5, -84.5).
begin;
insert into public.ips_permitidas (etiqueta, red) values ('Prueba', '203.0.113.5/32');
update public.centro set lat = 9.9, lng = -83.9, radio_m = 100 where id = 1;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select set_config('request.headers', '{"cf-connecting-ip":"203.0.113.5"}', true);
select public.registrar_marca('entrada', 10.5, -84.5, 15);
rollback;

-- 4) Una marca sin ubicación se guarda con la bandera "sin_ubicacion".
begin;
insert into public.ips_permitidas (etiqueta, red) values ('Prueba', '203.0.113.5/32');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select set_config('request.headers', '{"cf-connecting-ip":"203.0.113.5"}', true);
select public.registrar_marca('entrada');
rollback;

-- 5) Nadie puede insertar marcas directamente. Resultado esperado: error "permission denied".
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
insert into public.marcas_asistencia (empleado_id, tipo, ip_origen, bandera_ubicacion)
values (gen_random_uuid(), 'entrada', '1.1.1.1', 'ok');
rollback;

-- 6) Las marcas no se pueden modificar, ni siquiera desde el SQL Editor.
--    Resultado esperado: error "Las marcas de asistencia no se pueden modificar ni borrar."
begin;
insert into public.ips_permitidas (etiqueta, red) values ('Prueba', '203.0.113.5/32');
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select set_config('request.headers', '{"cf-connecting-ip":"203.0.113.5"}', true);
select public.registrar_marca('entrada', 9.9, -83.9, 15);
reset role;
update public.marcas_asistencia set tipo = 'salida';
rollback;

-- 7) Una empleada no puede agregar redes. Resultado esperado: error "No tienes permiso para esta acción."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-EMPLEADO","role":"authenticated"}', true);
select public.agregar_red_permitida('Hackeo', '1.2.3.4');
rollback;

-- 8) La administradora no puede registrar redes enormes. Resultado esperado: "La red es demasiado amplia."
begin;
set local role authenticated;
select set_config('request.jwt.claims', '{"sub":"UUID-ADMIN","role":"authenticated"}', true);
select public.agregar_red_permitida('Todo internet', '0.0.0.0/0');
rollback;
