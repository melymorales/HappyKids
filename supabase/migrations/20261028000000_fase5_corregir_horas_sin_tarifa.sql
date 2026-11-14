-- Corrección de la fase 5: horas en días sin tarifa vigente
-- Problema: si una persona tenía horas en días ANTERIORES al inicio de su primera tarifa
-- (por ejemplo, porque su fecha de ingreso se registró más tarde que su primer día real),
-- esas horas se contaban en el total pero se pagaban en 0, sin un aviso claro.
-- Ahora: (1) el cálculo avisa cuántas horas no se pagaron, (2) no se puede guardar la quincena
-- mientras haya horas sin tarifa, y (3) al adelantar la fecha de ingreso, la primera tarifa
-- también empieza en esa fecha.
-- Cómo aplicarla: Supabase > SQL Editor > New query > pegar todo > Run.

--insert into public.perfiles (id, rol, nombre_completo, correo, debe_cambiar_clave)
--select id, 'admin', 'NOMBRE COMPLETO', email, true
--from auth.users
--where email = 'correo@ejemplo.com';

-- 1) Cálculo con la columna nueva "minutos_sin_tarifa" ----------------------------------------------
drop function public.calcular_nomina(date, date);

create function public.calcular_nomina(p_desde date, p_hasta date)
returns table (
  empleado_id uuid,
  nombre_completo text,
  modalidad_pago public.modalidad_pago,
  tarifa_crc bigint,
  minutos_trabajados integer,
  cantidad_grupos integer,
  monto_crc bigint,
  advertencia text,
  minutos_sin_tarifa integer
)
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;
  if p_desde is null or p_hasta is null or p_hasta < p_desde then
    raise exception 'Las fechas no son válidas.';
  end if;
  if p_hasta - p_desde > 30 then
    raise exception 'La quincena no puede durar más de 31 días.';
  end if;

  return query
  with dias as (
    select d::date as fecha
    from generate_series(p_desde::timestamp, p_hasta::timestamp, interval '1 day') d
  ),
  personal as (
    select e.id as empleado_id, p.nombre_completo, e.fecha_ingreso, e.activo
    from public.empleados e
    join public.perfiles p on p.id = e.perfil_id
    where e.fecha_ingreso <= p_hasta
  ),
  -- Tarifa vigente de cada empleado en cada día de la quincena.
  tarifa_dia as (
    select pe.empleado_id, d.fecha, t.modalidad_pago, t.tarifa_crc
    from personal pe
    cross join dias d
    join public.tarifas_empleado t
      on t.empleado_id = pe.empleado_id
     and t.vigente_desde <= d.fecha
     and (t.vigente_hasta is null or t.vigente_hasta > d.fecha)
  ),
  resumen_tarifas as (
    select td.empleado_id,
           count(distinct td.modalidad_pago) as modalidades,
           count(distinct (td.modalidad_pago, td.tarifa_crc)) as variantes
    from tarifa_dia td
    group by td.empleado_id
  ),
  tarifa_final as (
    select td.empleado_id, td.modalidad_pago, td.tarifa_crc
    from tarifa_dia td
    where td.fecha = p_hasta
  ),
  horas as (
    select j.empleado_id, j.fecha, j.minutos, j.incompleta
    from public.jornadas(p_desde, p_hasta, null) j
  ),
  pago_horas as (
    select h.empleado_id,
           sum(h.minutos)::integer as minutos,
           coalesce(
             sum(h.minutos::bigint * td.tarifa_crc) filter (where td.modalidad_pago = 'por_hora'),
             0
           ) as importe,
           -- Minutos en días en los que la persona no tenía ninguna tarifa vigente.
           coalesce(sum(h.minutos) filter (where td.empleado_id is null), 0)::integer as sin_tarifa,
           count(*) filter (where h.incompleta and h.fecha < public.hoy_cr()) as incompletas
    from horas h
    left join tarifa_dia td on td.empleado_id = h.empleado_id and td.fecha = h.fecha
    group by h.empleado_id
  ),
  pago_grupos as (
    select g.empleado_id,
           sum(g.cantidad_grupos)::integer as grupos,
           coalesce(
             sum(g.cantidad_grupos::bigint * td.tarifa_crc) filter (where td.modalidad_pago = 'por_grupo'),
             0
           ) as importe,
           coalesce(
             sum(g.cantidad_grupos) filter (where td.modalidad_pago is distinct from 'por_grupo'),
             0
           ) as sin_pago
    from public.registro_grupos g
    left join tarifa_dia td on td.empleado_id = g.empleado_id and td.fecha = g.fecha
    where g.fecha between p_desde and p_hasta
    group by g.empleado_id
  )
  select
    pe.empleado_id,
    pe.nombre_completo,
    tf.modalidad_pago,
    tf.tarifa_crc,
    coalesce(ph.minutos, 0),
    coalesce(pg.grupos, 0),
    (
      round(coalesce(ph.importe, 0) / 60.0)
      + coalesce(pg.importe, 0)
      + case when tf.modalidad_pago = 'quincena_fija' then tf.tarifa_crc else 0 end
    )::bigint,
    nullif(concat_ws(' ',
      case when tf.modalidad_pago = 'por_hora' and coalesce(ph.sin_tarifa, 0) > 0
           then 'Hay ' || (ph.sin_tarifa / 60)::text || ' h ' || lpad((ph.sin_tarifa % 60)::text, 2, '0')
                || ' min en días sin tarifa vigente: esas horas NO se pagaron. Corrige la fecha de ingreso del empleado.' end,
      case when rt.empleado_id is null
           then 'No tiene una tarifa vigente en estas fechas.' end,
      case when rt.modalidades > 1
           then 'La modalidad de pago cambió durante la quincena: revisa el cálculo.'
           when rt.variantes > 1
           then 'La tarifa cambió durante la quincena (por hora y por grupo se aplicó la vigente cada día; en salario fijo, la del último día).' end,
      case when tf.modalidad_pago = 'por_hora' and coalesce(ph.incompletas, 0) > 0
           then 'Tiene ' || ph.incompletas::text || ' jornada(s) incompleta(s): revisa las marcas antes de pagar.' end,
      case when tf.modalidad_pago = 'quincena_fija' and pe.fecha_ingreso > p_desde
           then 'Ingresó durante la quincena y se calculó la tarifa completa.' end,
      case when coalesce(pg.sin_pago, 0) > 0
           then 'Hay grupos registrados que no se pagan por su modalidad de pago.' end
    ), ''),
    coalesce(ph.sin_tarifa, 0)
  from personal pe
  left join resumen_tarifas rt on rt.empleado_id = pe.empleado_id
  left join tarifa_final tf on tf.empleado_id = pe.empleado_id
  left join pago_horas ph on ph.empleado_id = pe.empleado_id
  left join pago_grupos pg on pg.empleado_id = pe.empleado_id
  where pe.activo or coalesce(ph.minutos, 0) > 0 or coalesce(pg.grupos, 0) > 0
  order by pe.nombre_completo;
end;
$$;

revoke all on function public.calcular_nomina(date, date) from public, anon;
grant execute on function public.calcular_nomina(date, date) to authenticated;

-- 2) No se puede guardar una quincena con horas sin tarifa ---------------------------------------------
create or replace function public.guardar_periodo_nomina(p_desde date, p_hasta date)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
  v_filas integer;
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;
  if p_desde is null or p_hasta is null or p_hasta < p_desde then
    raise exception 'Las fechas no son válidas.';
  end if;
  if p_hasta >= public.hoy_cr() then
    raise exception 'La quincena todavía no termina. Guárdala a partir del día siguiente a su último día.';
  end if;

  if exists (
    select 1 from public.calcular_nomina(p_desde, p_hasta) c
    where c.modalidad_pago = 'por_hora' and c.minutos_sin_tarifa > 0
  ) then
    raise exception 'Hay empleados con horas en días sin tarifa vigente. Corrige su fecha de ingreso antes de guardar la quincena.';
  end if;

  begin
    insert into public.periodos_nomina (fecha_inicio, fecha_fin, creado_por)
    values (p_desde, p_hasta, (select auth.uid()))
    returning id into v_id;
  exception when exclusion_violation then
    raise exception 'Ya existe una quincena guardada que se cruza con estas fechas.';
  end;

  insert into public.detalle_nomina
    (periodo_id, empleado_id, modalidad_pago, tarifa_crc, minutos_trabajados,
     cantidad_grupos, monto_crc, notas)
  select
    v_id, c.empleado_id, c.modalidad_pago, c.tarifa_crc, c.minutos_trabajados,
    c.cantidad_grupos, c.monto_crc, c.advertencia
  from public.calcular_nomina(p_desde, p_hasta) c;

  get diagnostics v_filas = row_count;
  if v_filas = 0 then
    raise exception 'No hay empleados para calcular en estas fechas.';
  end if;

  return v_id;
end;
$$;

-- 3) Al adelantar la fecha de ingreso, la primera tarifa empieza en esa fecha ------------------------
create or replace function public.actualizar_empleado(
  p_empleado_id uuid,
  p_nombre_completo text,
  p_puesto text,
  p_fecha_ingreso date,
  p_notas text
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil_id uuid;
  v_primera public.tarifas_empleado%rowtype;
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;
  if p_nombre_completo is null or char_length(trim(p_nombre_completo)) = 0 then
    raise exception 'Escribe el nombre completo.';
  end if;
  if p_puesto is null or char_length(trim(p_puesto)) = 0 then
    raise exception 'Escribe el puesto.';
  end if;
  if p_fecha_ingreso is null then
    raise exception 'Elige la fecha de ingreso.';
  end if;

  -- Si la fecha de ingreso es anterior al inicio de la primera tarifa, la tarifa se adelanta.
  select * into v_primera
  from public.tarifas_empleado
  where empleado_id = p_empleado_id
  order by vigente_desde asc
  limit 1;

  if found and p_fecha_ingreso < v_primera.vigente_desde then
    if exists (
      select 1 from public.periodos_nomina
      where daterange(fecha_inicio, fecha_fin, '[]') && daterange(p_fecha_ingreso, v_primera.vigente_desde, '[)')
    ) then
      raise exception 'No se puede adelantar la fecha de ingreso: hay una quincena guardada en esas fechas.';
    end if;
    update public.tarifas_empleado set vigente_desde = p_fecha_ingreso where id = v_primera.id;
  end if;

  update public.empleados
  set puesto = trim(p_puesto),
      fecha_ingreso = p_fecha_ingreso,
      notas = nullif(trim(coalesce(p_notas, '')), '')
  where id = p_empleado_id
  returning perfil_id into v_perfil_id;

  if v_perfil_id is null then
    raise exception 'No encontramos a ese empleado.';
  end if;

  update public.perfiles
  set nombre_completo = trim(p_nombre_completo)
  where id = v_perfil_id;
end;
$$;
