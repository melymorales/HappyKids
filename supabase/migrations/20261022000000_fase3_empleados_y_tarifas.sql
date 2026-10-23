-- Fase 3: empleados, tarifas (con historial) y bitácora de auditoría
-- Cómo aplicarla: Supabase > SQL Editor > New query > pegar todo > Run.

-- 1) Extensión y tipos ---------------------------------------------------------
create extension if not exists btree_gist with schema extensions;

create type public.modalidad_pago as enum ('por_hora', 'quincena_fija', 'por_grupo');

-- 2) Funciones auxiliares -------------------------------------------------------
-- Fecha de hoy en Costa Rica.
create function public.hoy_cr()
returns date
language sql
stable
set search_path = ''
as $$
  select (now() at time zone 'America/Costa_Rica')::date;
$$;

-- ¿La persona que consulta tiene el perfil activo?
create function public.es_usuario_activo()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and activo
  );
$$;

-- 3) Tablas ----------------------------------------------------------------------
create table public.empleados (
  id uuid primary key default gen_random_uuid(),
  perfil_id uuid not null unique references public.perfiles (id) on delete cascade,
  puesto text not null check (char_length(trim(puesto)) > 0),
  fecha_ingreso date not null,
  activo boolean not null default true,
  notas text,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

create table public.tarifas_empleado (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete cascade,
  modalidad_pago public.modalidad_pago not null,
  tarifa_crc bigint not null check (tarifa_crc > 0),
  vigente_desde date not null,
  vigente_hasta date,
  creado_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now(),
  constraint tarifas_fechas_validas
    check (vigente_hasta is null or vigente_hasta > vigente_desde),
  -- Un empleado no puede tener dos tarifas vigentes al mismo tiempo.
  constraint tarifas_sin_solapes exclude using gist (
    empleado_id with =,
    daterange(vigente_desde, vigente_hasta, '[)') with &&
  )
);

create table public.bitacora_auditoria (
  id bigint generated always as identity primary key,
  actor_id uuid,
  accion text not null,
  tabla text not null,
  registro_id text,
  datos_anteriores jsonb,
  datos_nuevos jsonb,
  creado_en timestamptz not null default now()
);

create index bitacora_auditoria_tabla_fecha
  on public.bitacora_auditoria (tabla, creado_en desc);

-- 4) Disparadores -------------------------------------------------------------------
create trigger empleados_actualizado_en
  before update on public.empleados
  for each row execute function public.fijar_actualizado_en();

-- Registra en la bitácora cada alta o cambio (quién, qué, antes y después).
create function public.registrar_auditoria()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.bitacora_auditoria
    (actor_id, accion, tabla, registro_id, datos_anteriores, datos_nuevos)
  values (
    (select auth.uid()),
    tg_op,
    tg_table_name,
    to_jsonb(new) ->> 'id',
    case when tg_op = 'UPDATE' then to_jsonb(old) end,
    to_jsonb(new)
  );
  return new;
end;
$$;

create trigger empleados_auditoria
  after insert or update on public.empleados
  for each row execute function public.registrar_auditoria();

create trigger tarifas_empleado_auditoria
  after insert or update on public.tarifas_empleado
  for each row execute function public.registrar_auditoria();

create trigger perfiles_auditoria
  after insert or update on public.perfiles
  for each row execute function public.registrar_auditoria();

-- 5) Seguridad a nivel de fila (RLS) --------------------------------------------------
alter table public.empleados enable row level security;
alter table public.tarifas_empleado enable row level security;
alter table public.bitacora_auditoria enable row level security;

create policy "empleados: cada persona lee el suyo"
  on public.empleados for select to authenticated
  using (perfil_id = (select auth.uid()) and public.es_usuario_activo());

create policy "empleados: la administradora lee todos"
  on public.empleados for select to authenticated
  using (public.es_admin());

create policy "tarifas: cada persona lee las suyas"
  on public.tarifas_empleado for select to authenticated
  using (
    public.es_usuario_activo()
    and exists (
      select 1 from public.empleados e
      where e.id = empleado_id and e.perfil_id = (select auth.uid())
    )
  );

create policy "tarifas: la administradora lee todas"
  on public.tarifas_empleado for select to authenticated
  using (public.es_admin());

create policy "bitacora: la administradora lee"
  on public.bitacora_auditoria for select to authenticated
  using (public.es_admin());

-- Desde ahora todos los cambios pasan por funciones controladas (con auditoría):
-- se quita la política de actualización de perfiles de la fase 2.
drop policy "perfiles: la administradora actualiza" on public.perfiles;

-- 6) Funciones de escritura (solo administradora) --------------------------------------
create function public.actualizar_empleado(
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

-- Activa o desactiva al empleado y, con él, su acceso al sistema.
create function public.cambiar_estado_empleado(
  p_empleado_id uuid,
  p_activo boolean
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_perfil_id uuid;
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;

  update public.empleados
  set activo = p_activo
  where id = p_empleado_id
  returning perfil_id into v_perfil_id;

  if v_perfil_id is null then
    raise exception 'No encontramos a ese empleado.';
  end if;

  update public.perfiles set activo = p_activo where id = v_perfil_id;
end;
$$;

-- Agrega una tarifa nueva y cierra la anterior el día que empieza la nueva.
-- El historial nunca se edita ni se borra.
create function public.agregar_tarifa(
  p_empleado_id uuid,
  p_modalidad_pago public.modalidad_pago,
  p_tarifa_crc bigint,
  p_vigente_desde date
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_id uuid;
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;
  if p_tarifa_crc is null or p_tarifa_crc <= 0 then
    raise exception 'La tarifa debe ser mayor que cero.';
  end if;
  if p_vigente_desde is null then
    raise exception 'Elige desde qué fecha aplica la tarifa.';
  end if;
  if not exists (select 1 from public.empleados where id = p_empleado_id) then
    raise exception 'No encontramos a ese empleado.';
  end if;
  if exists (
    select 1 from public.tarifas_empleado
    where empleado_id = p_empleado_id and vigente_desde >= p_vigente_desde
  ) then
    raise exception 'Ya existe una tarifa que empieza en esa fecha o después. Elige una fecha posterior.';
  end if;

  update public.tarifas_empleado
  set vigente_hasta = p_vigente_desde
  where empleado_id = p_empleado_id and vigente_hasta is null;

  insert into public.tarifas_empleado
    (empleado_id, modalidad_pago, tarifa_crc, vigente_desde, creado_por)
  values
    (p_empleado_id, p_modalidad_pago, p_tarifa_crc, p_vigente_desde, (select auth.uid()))
  returning id into v_id;

  return v_id;
end;
$$;

-- 7) Vista con el resumen de cada empleado (tarifa vigente hoy) -------------------------
-- security_invoker: respeta las reglas RLS de quien consulta
-- (la administradora ve todos; cada empleado, solo el suyo).
create view public.empleados_resumen
with (security_invoker = true) as
select
  e.id,
  e.perfil_id,
  p.nombre_completo,
  p.correo,
  e.puesto,
  e.fecha_ingreso,
  e.activo,
  e.notas,
  t.modalidad_pago,
  t.tarifa_crc,
  t.vigente_desde
from public.empleados e
join public.perfiles p on p.id = e.perfil_id
left join public.tarifas_empleado t
  on t.empleado_id = e.id
 and t.vigente_desde <= public.hoy_cr()
 and (t.vigente_hasta is null or t.vigente_hasta > public.hoy_cr());

-- 8) Permisos de tablas y funciones -----------------------------------------------------
revoke all on table public.empleados, public.tarifas_empleado, public.bitacora_auditoria
  from anon;
revoke insert, update, delete, truncate
  on table public.empleados, public.tarifas_empleado, public.bitacora_auditoria
  from authenticated;
grant select on table public.empleados, public.tarifas_empleado, public.bitacora_auditoria
  to authenticated;

revoke update on table public.perfiles from authenticated;

revoke all on table public.empleados_resumen from anon;
grant select on table public.empleados_resumen to authenticated;

revoke all on function public.registrar_auditoria() from public, anon, authenticated;

revoke all on function public.hoy_cr() from public, anon;
revoke all on function public.es_usuario_activo() from public, anon;
grant execute on function public.hoy_cr() to authenticated;
grant execute on function public.es_usuario_activo() to authenticated;

revoke all on function public.actualizar_empleado(uuid, text, text, date, text) from public, anon;
revoke all on function public.cambiar_estado_empleado(uuid, boolean) from public, anon;
revoke all on function public.agregar_tarifa(uuid, public.modalidad_pago, bigint, date) from public, anon;
grant execute on function public.actualizar_empleado(uuid, text, text, date, text) to authenticated;
grant execute on function public.cambiar_estado_empleado(uuid, boolean) to authenticated;
grant execute on function public.agregar_tarifa(uuid, public.modalidad_pago, bigint, date) to authenticated;
