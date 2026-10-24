-- Fase 5: nómina (grupos atendidos, cálculo de quincenas, historial y pagos)
-- Cómo aplicarla: Supabase > SQL Editor > New query > pegar todo > Run.
-- Requiere las fases 3 y 4 (empleados, tarifas y asistencia) ya aplicadas.

-- 1) Tipos ------------------------------------------------------------------------
create type public.estado_pago as enum ('pendiente', 'pagada');

-- 2) Tablas -------------------------------------------------------------------------
-- Grupos atendidos por día (para quien cobra por grupo).
create table public.registro_grupos (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete restrict,
  fecha date not null,
  cantidad_grupos integer not null check (cantidad_grupos between 0 and 50),
  notas text,
  creado_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now(),
  unique (empleado_id, fecha)
);

-- Una quincena guardada. No se pueden cruzar las fechas de dos quincenas.
create table public.periodos_nomina (
  id uuid primary key default gen_random_uuid(),
  fecha_inicio date not null,
  fecha_fin date not null,
  creado_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  constraint periodo_fechas_validas
    check (fecha_fin >= fecha_inicio and fecha_fin - fecha_inicio <= 30),
  constraint periodos_sin_solapes
    exclude using gist (daterange(fecha_inicio, fecha_fin, '[]') with &&)
);

-- Foto del cálculo de cada empleado en una quincena guardada.
create table public.detalle_nomina (
  id uuid primary key default gen_random_uuid(),
  periodo_id uuid not null references public.periodos_nomina (id) on delete restrict,
  empleado_id uuid not null references public.empleados (id) on delete restrict,
  modalidad_pago public.modalidad_pago,
  tarifa_crc bigint,
  minutos_trabajados integer not null default 0,
  cantidad_grupos integer not null default 0,
  monto_crc bigint not null check (monto_crc >= 0),
  estado public.estado_pago not null default 'pendiente',
  pagada_en date,
  pagada_por uuid references auth.users (id) on delete set null,
  notas text,
  creado_en timestamptz not null default now(),
  unique (periodo_id, empleado_id),
  constraint pago_coherente check ((estado = 'pagada') = (pagada_en is not null))
);

create index detalle_nomina_empleado on public.detalle_nomina (empleado_id);

-- 3) Disparadores ---------------------------------------------------------------------
create trigger registro_grupos_actualizado_en
  before update on public.registro_grupos
  for each row execute function public.fijar_actualizado_en();

create function public.proteger_registro_grupos()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Los registros de grupos no se pueden borrar.';
end;
$$;

create trigger registro_grupos_sin_borrar
  before delete on public.registro_grupos
  for each row execute function public.proteger_registro_grupos();

-- Las quincenas guardadas no se modifican ni se borran.
create trigger periodos_inalterables
  before update or delete on public.periodos_nomina
  for each row execute function public.bloquear_cambios_registro();

-- Del detalle solo puede cambiar el estado de pago.
create function public.proteger_detalle_nomina()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Los detalles de nómina no se pueden borrar.';
  end if;
  if new.periodo_id <> old.periodo_id
     or new.empleado_id <> old.empleado_id
     or new.modalidad_pago is distinct from old.modalidad_pago
     or new.tarifa_crc is distinct from old.tarifa_crc
     or new.minutos_trabajados <> old.minutos_trabajados
     or new.cantidad_grupos <> old.cantidad_grupos
     or new.monto_crc <> old.monto_crc
     or new.notas is distinct from old.notas then
    raise exception 'El cálculo de una quincena guardada no se puede modificar.';
  end if;
  return new;
end;
$$;

create trigger detalle_nomina_protegido
  before update or delete on public.detalle_nomina
  for each row execute function public.proteger_detalle_nomina();

create trigger registro_grupos_auditoria
  after insert or update on public.registro_grupos
  for each row execute function public.registrar_auditoria();

create trigger periodos_nomina_auditoria
  after insert or update on public.periodos_nomina
  for each row execute function public.registrar_auditoria();

create trigger detalle_nomina_auditoria
  after insert or update on public.detalle_nomina
  for each row execute function public.registrar_auditoria();

-- 4) Cálculo de la quincena (vista previa, no guarda nada) -------------------------------------
-- Reglas:
--  * Por hora: suma de (minutos de cada día x tarifa vigente ese día) / 60, redondeado al colón una sola vez.
--  * Salario fijo por quincena: la tarifa completa vigente el último día de la quincena.
--    No se descuentan ausencias ni permisos sin goce, y no hay deducciones de ley.
--  * Por grupo: suma de (grupos de cada día x tarifa vigente ese día).
create function public.calcular_nomina(p_desde date, p_hasta date)
returns table (
  empleado_id uuid,
  nombre_completo text,
  modalidad_pago public.modalidad_pago,
  tarifa_crc bigint,
  minutos_trabajados integer,
  cantidad_grupos integer,
  monto_crc bigint,
  advertencia text
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
    ), '')
  from personal pe
  left join resumen_tarifas rt on rt.empleado_id = pe.empleado_id
  left join tarifa_final tf on tf.empleado_id = pe.empleado_id
  left join pago_horas ph on ph.empleado_id = pe.empleado_id
  left join pago_grupos pg on pg.empleado_id = pe.empleado_id
  where pe.activo or coalesce(ph.minutos, 0) > 0 or coalesce(pg.grupos, 0) > 0
  order by pe.nombre_completo;
end;
$$;

-- 5) Funciones de escritura (solo administradora) ------------------------------------------------
-- Registrar (o reemplazar) los grupos atendidos por una persona en un día.
create function public.registrar_grupos(
  p_empleado_id uuid,
  p_fecha date,
  p_cantidad integer,
  p_notas text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;
  if p_fecha is null then
    raise exception 'Elige la fecha.';
  end if;
  if p_fecha > public.hoy_cr() then
    raise exception 'La fecha no puede estar en el futuro.';
  end if;
  if p_cantidad is null or p_cantidad < 0 or p_cantidad > 50 then
    raise exception 'La cantidad de grupos debe estar entre 0 y 50.';
  end if;
  if not exists (select 1 from public.empleados where id = p_empleado_id) then
    raise exception 'No encontramos a ese empleado.';
  end if;
  if exists (
    select 1 from public.periodos_nomina
    where p_fecha between fecha_inicio and fecha_fin
  ) then
    raise exception 'Esa fecha pertenece a una quincena ya guardada y no se puede cambiar.';
  end if;

  insert into public.registro_grupos (empleado_id, fecha, cantidad_grupos, notas, creado_por)
  values (p_empleado_id, p_fecha, p_cantidad, nullif(trim(coalesce(p_notas, '')), ''), (select auth.uid()))
  on conflict (empleado_id, fecha)
  do update set cantidad_grupos = excluded.cantidad_grupos, notas = excluded.notas;
end;
$$;

-- Guardar una quincena: calcula y conserva la foto del cálculo de cada empleado.
create function public.guardar_periodo_nomina(p_desde date, p_hasta date)
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

-- Marcar un pago como realizado (o volverlo a pendiente). Registrar el pago no mueve dinero.
create function public.marcar_detalle_pagado(
  p_detalle_id uuid,
  p_pagada boolean,
  p_fecha date default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fecha date := coalesce(p_fecha, public.hoy_cr());
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;
  if p_pagada and v_fecha > public.hoy_cr() then
    raise exception 'La fecha de pago no puede estar en el futuro.';
  end if;

  update public.detalle_nomina
  set estado = case when p_pagada then 'pagada'::public.estado_pago else 'pendiente'::public.estado_pago end,
      pagada_en = case when p_pagada then v_fecha end,
      pagada_por = case when p_pagada then (select auth.uid()) end
  where id = p_detalle_id;

  if not found then
    raise exception 'No encontramos ese pago.';
  end if;
end;
$$;

-- Marcar como pagados todos los pendientes de una quincena.
create function public.marcar_periodo_pagado(p_periodo_id uuid, p_fecha date default null)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_fecha date := coalesce(p_fecha, public.hoy_cr());
  v_filas integer;
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;
  if v_fecha > public.hoy_cr() then
    raise exception 'La fecha de pago no puede estar en el futuro.';
  end if;

  update public.detalle_nomina
  set estado = 'pagada', pagada_en = v_fecha, pagada_por = (select auth.uid())
  where periodo_id = p_periodo_id and estado = 'pendiente';

  get diagnostics v_filas = row_count;
  return v_filas;
end;
$$;

-- 6) Vistas ---------------------------------------------------------------------------------------------
-- Resumen de cada quincena guardada.
create view public.periodos_resumen
with (security_invoker = true) as
select
  per.id,
  per.fecha_inicio,
  per.fecha_fin,
  per.creado_en,
  count(d.id) as empleados,
  coalesce(sum(d.monto_crc), 0)::bigint as total_crc,
  count(d.id) filter (where d.estado = 'pendiente') as pendientes
from public.periodos_nomina per
left join public.detalle_nomina d on d.periodo_id = per.id
group by per.id;

-- Detalle con nombres y fechas. Las advertencias internas solo las ve la administradora.
create view public.nomina_detalle
with (security_invoker = true) as
select
  d.id,
  d.periodo_id,
  per.fecha_inicio,
  per.fecha_fin,
  d.empleado_id,
  p.nombre_completo,
  d.modalidad_pago,
  d.tarifa_crc,
  d.minutos_trabajados,
  d.cantidad_grupos,
  d.monto_crc,
  d.estado,
  d.pagada_en,
  case when public.es_admin() then d.notas end as advertencias
from public.detalle_nomina d
join public.periodos_nomina per on per.id = d.periodo_id
join public.empleados e on e.id = d.empleado_id
join public.perfiles p on p.id = e.perfil_id;

-- 7) Seguridad a nivel de fila (RLS) ------------------------------------------------------------------------
alter table public.registro_grupos enable row level security;
alter table public.periodos_nomina enable row level security;
alter table public.detalle_nomina enable row level security;

create policy "grupos: la administradora lee"
  on public.registro_grupos for select to authenticated
  using (public.es_admin());

create policy "grupos: cada persona lee los suyos"
  on public.registro_grupos for select to authenticated
  using (
    public.es_usuario_activo()
    and exists (
      select 1 from public.empleados e
      where e.id = empleado_id and e.perfil_id = (select auth.uid())
    )
  );

create policy "periodos: la administradora lee"
  on public.periodos_nomina for select to authenticated
  using (public.es_admin());

create policy "periodos: cada persona lee los suyos"
  on public.periodos_nomina for select to authenticated
  using (
    public.es_usuario_activo()
    and exists (
      select 1
      from public.detalle_nomina d
      join public.empleados e on e.id = d.empleado_id
      where d.periodo_id = periodos_nomina.id and e.perfil_id = (select auth.uid())
    )
  );

create policy "detalle: la administradora lee"
  on public.detalle_nomina for select to authenticated
  using (public.es_admin());

create policy "detalle: cada persona lee el suyo"
  on public.detalle_nomina for select to authenticated
  using (
    public.es_usuario_activo()
    and exists (
      select 1 from public.empleados e
      where e.id = empleado_id and e.perfil_id = (select auth.uid())
    )
  );

-- 8) Permisos de tablas y funciones -----------------------------------------------------------------------
revoke all on table public.registro_grupos, public.periodos_nomina, public.detalle_nomina from anon;
revoke insert, update, delete, truncate
  on table public.registro_grupos, public.periodos_nomina, public.detalle_nomina from authenticated;
grant select on table public.registro_grupos, public.periodos_nomina, public.detalle_nomina to authenticated;

revoke all on table public.periodos_resumen, public.nomina_detalle from anon;
grant select on table public.periodos_resumen, public.nomina_detalle to authenticated;

revoke all on function public.proteger_registro_grupos() from public, anon, authenticated;
revoke all on function public.proteger_detalle_nomina() from public, anon, authenticated;

revoke all on function public.calcular_nomina(date, date) from public, anon;
revoke all on function public.registrar_grupos(uuid, date, integer, text) from public, anon;
revoke all on function public.guardar_periodo_nomina(date, date) from public, anon;
revoke all on function public.marcar_detalle_pagado(uuid, boolean, date) from public, anon;
revoke all on function public.marcar_periodo_pagado(uuid, date) from public, anon;

grant execute on function public.calcular_nomina(date, date) to authenticated;
grant execute on function public.registrar_grupos(uuid, date, integer, text) to authenticated;
grant execute on function public.guardar_periodo_nomina(date, date) to authenticated;
grant execute on function public.marcar_detalle_pagado(uuid, boolean, date) to authenticated;
grant execute on function public.marcar_periodo_pagado(uuid, date) to authenticated;
