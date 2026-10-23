-- Fase 4A: asistencia (marcas, redes permitidas y ubicación del kínder)
-- Cómo aplicarla: Supabase > SQL Editor > New query > pegar todo > Run.

-- 1) Tipos ---------------------------------------------------------------------
create type public.tipo_marca as enum ('entrada', 'salida');

-- 2) Tablas ----------------------------------------------------------------------
-- Ubicación del kínder: una sola fila.
create table public.centro (
  id smallint primary key default 1 check (id = 1),
  nombre text not null default 'Happy Kids',
  lat double precision check (lat between -90 and 90),
  lng double precision check (lng between -180 and 180),
  radio_m integer not null default 100 check (radio_m between 10 and 5000),
  zona_horaria text not null default 'America/Costa_Rica',
  actualizado_en timestamptz not null default now(),
  constraint centro_ubicacion_completa check ((lat is null) = (lng is null))
);

insert into public.centro (id) values (1);

-- Redes (rangos de IP pública) desde las que se puede marcar.
create table public.ips_permitidas (
  id uuid primary key default gen_random_uuid(),
  etiqueta text not null check (char_length(trim(etiqueta)) > 0),
  red cidr not null unique,
  activa boolean not null default true,
  creado_por uuid references auth.users (id) on delete set null,
  creado_en timestamptz not null default now()
);

-- Marcas de entrada y salida. Solo se agregan: nunca se editan ni se borran.
create table public.marcas_asistencia (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete restrict,
  tipo public.tipo_marca not null,
  marcada_en timestamptz not null default now(),
  ip_origen inet not null,
  lat double precision,
  lng double precision,
  precision_m real,
  distancia_m integer,
  bandera_ubicacion text not null
    check (bandera_ubicacion in ('ok', 'fuera_de_radio', 'sin_ubicacion'))
);

create index marcas_asistencia_empleado_fecha
  on public.marcas_asistencia (empleado_id, marcada_en desc);
create index marcas_asistencia_fecha
  on public.marcas_asistencia (marcada_en desc);

-- 3) Disparadores -------------------------------------------------------------------
create trigger centro_actualizado_en
  before update on public.centro
  for each row execute function public.fijar_actualizado_en();

create trigger centro_auditoria
  after insert or update on public.centro
  for each row execute function public.registrar_auditoria();

create trigger ips_permitidas_auditoria
  after insert or update on public.ips_permitidas
  for each row execute function public.registrar_auditoria();

-- Las marcas son inalterables: ni siquiera una administradora puede cambiarlas.
create function public.bloquear_cambios_marca()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Las marcas de asistencia no se pueden modificar ni borrar.';
end;
$$;

create trigger marcas_inalterables
  before update or delete on public.marcas_asistencia
  for each row execute function public.bloquear_cambios_marca();

create trigger marcas_sin_vaciar
  before truncate on public.marcas_asistencia
  for each statement execute function public.bloquear_cambios_marca();

-- 4) Funciones auxiliares ----------------------------------------------------------------
-- IP pública de quien hace la llamada, según Cloudflare (no se puede falsear desde el cliente).
create function public.ip_cliente()
returns inet
language plpgsql
stable
set search_path = ''
as $$
declare
  v_encabezados json;
  v_ip text;
begin
  v_encabezados := nullif(current_setting('request.headers', true), '')::json;
  v_ip := trim(v_encabezados ->> 'cf-connecting-ip');
  if v_ip is null or v_ip = '' then
    return null;
  end if;
  return v_ip::inet;
exception when others then
  return null;
end;
$$;

-- Distancia en metros entre dos puntos (fórmula de Haversine).
create function public.distancia_metros(
  lat1 double precision, lng1 double precision,
  lat2 double precision, lng2 double precision
)
returns double precision
language sql
immutable
set search_path = ''
as $$
  select 2 * 6371000 * asin(sqrt(
    power(sin(radians(lat2 - lat1) / 2), 2)
    + cos(radians(lat1)) * cos(radians(lat2)) * power(sin(radians(lng2 - lng1) / 2), 2)
  ));
$$;

-- Anota en la bitácora un intento de marcación rechazado.
create function public.anotar_marca_rechazada(
  p_uid uuid, p_motivo text, p_ip inet, p_tipo public.tipo_marca
)
returns void
language sql
security definer
set search_path = ''
as $$
  insert into public.bitacora_auditoria (actor_id, accion, tabla, datos_nuevos)
  values (
    p_uid,
    'MARCA_RECHAZADA',
    'marcas_asistencia',
    jsonb_build_object('motivo', p_motivo, 'ip', host(p_ip), 'tipo', p_tipo)
  );
$$;

-- 5) Registrar una marca (la usan las empleadas) ---------------------------------------------
-- Devuelve siempre un JSON: { ok: true, ... } o { ok: false, motivo, mensaje }.
create function public.registrar_marca(
  p_tipo public.tipo_marca,
  p_lat double precision default null,
  p_lng double precision default null,
  p_precision_m real default null
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_empleado_id uuid;
  v_ip inet := public.ip_cliente();
  v_centro public.centro%rowtype;
  v_ultima public.marcas_asistencia%rowtype;
  v_hay_ultima boolean;
  v_entrada_abierta boolean;
  v_distancia integer;
  v_bandera text;
  v_ahora timestamptz := now();
begin
  -- 1) Debe ser una empleada con cuenta activa.
  select e.id into v_empleado_id
  from public.empleados e
  join public.perfiles p on p.id = e.perfil_id
  where e.perfil_id = v_uid and e.activo and p.activo;

  if v_empleado_id is null then
    return jsonb_build_object('ok', false, 'motivo', 'sin_permiso',
      'mensaje', 'Tu cuenta no puede marcar asistencia.');
  end if;

  -- 2) Debe marcar desde una red permitida (el Wi-Fi del kínder).
  if v_ip is null then
    perform public.anotar_marca_rechazada(v_uid, 'red_desconocida', null, p_tipo);
    return jsonb_build_object('ok', false, 'motivo', 'red_desconocida',
      'mensaje', 'No pudimos verificar tu red. Inténtalo de nuevo o avisa a la administradora.');
  end if;

  if not exists (
    select 1 from public.ips_permitidas where activa and v_ip <<= red
  ) then
    perform public.anotar_marca_rechazada(v_uid, 'fuera_de_red', v_ip, p_tipo);
    return jsonb_build_object('ok', false, 'motivo', 'fuera_de_red',
      'mensaje', 'Solo puedes marcar conectada al Wi-Fi del kínder.');
  end if;

  -- 3) La secuencia debe tener sentido (una persona a la vez).
  perform pg_advisory_xact_lock(hashtextextended(v_empleado_id::text, 0));

  select * into v_ultima
  from public.marcas_asistencia
  where empleado_id = v_empleado_id
  order by marcada_en desc
  limit 1;
  v_hay_ultima := found;

  -- Una entrada sin salida cuenta como "abierta" durante 16 horas.
  v_entrada_abierta := v_hay_ultima
    and v_ultima.tipo = 'entrada'
    and v_ultima.marcada_en > v_ahora - interval '16 hours';

  if p_tipo = 'entrada' and v_entrada_abierta then
    return jsonb_build_object('ok', false, 'motivo', 'entrada_abierta',
      'mensaje', 'Ya marcaste tu entrada. Si te vas, marca la salida.');
  end if;

  if p_tipo = 'salida' and not v_entrada_abierta then
    return jsonb_build_object('ok', false, 'motivo', 'sin_entrada',
      'mensaje', 'No hay una entrada abierta para marcar la salida. Marca primero la entrada o pide una corrección a la administradora.');
  end if;

  -- 4) Ubicación: solo sirve de apoyo. Si no cuadra, la marca se guarda pero queda señalada.
  select * into v_centro from public.centro where id = 1;

  if p_lat is null or p_lng is null
     or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    v_bandera := 'sin_ubicacion';
    v_distancia := null;
  elsif v_centro.lat is null then
    -- Todavía no se registró la ubicación del kínder: no se puede comparar.
    v_bandera := 'ok';
    v_distancia := null;
  else
    v_distancia := round(public.distancia_metros(p_lat, p_lng, v_centro.lat, v_centro.lng))::integer;
    v_bandera := case when v_distancia > v_centro.radio_m then 'fuera_de_radio' else 'ok' end;
  end if;

  insert into public.marcas_asistencia
    (empleado_id, tipo, marcada_en, ip_origen, lat, lng, precision_m, distancia_m, bandera_ubicacion)
  values
    (v_empleado_id, p_tipo, v_ahora, v_ip, p_lat, p_lng, p_precision_m, v_distancia, v_bandera);

  return jsonb_build_object('ok', true, 'tipo', p_tipo, 'marcada_en', v_ahora, 'bandera', v_bandera);
end;
$$;

-- 6) Funciones de la administradora --------------------------------------------------------------
-- Muestra qué IP detecta el sistema para quien llama (sirve para registrar la red del kínder).
create function public.detectar_mi_red()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_ip inet;
  v_red cidr;
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;

  v_ip := public.ip_cliente();
  if v_ip is null then
    return jsonb_build_object('ok', false,
      'mensaje', 'El sistema no pudo leer tu dirección IP.');
  end if;

  -- IPv4: la dirección exacta. IPv6: el rango /64 (cada dispositivo usa una dirección distinta dentro de él).
  v_red := case
    when family(v_ip) = 6 then network(set_masklen(v_ip, 64))
    else network(set_masklen(v_ip, 32))
  end;

  return jsonb_build_object('ok', true, 'ip', host(v_ip), 'red', v_red::text, 'version', family(v_ip));
end;
$$;

create function public.agregar_red_permitida(p_etiqueta text, p_red text)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_red cidr;
  v_id uuid;
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;
  if p_etiqueta is null or char_length(trim(p_etiqueta)) = 0 then
    raise exception 'Escribe un nombre para la red, por ejemplo "Wi-Fi del kínder".';
  end if;

  begin
    v_red := trim(p_red)::cidr;
  exception when others then
    raise exception 'La red no es válida. Ejemplo: 190.10.20.30';
  end;

  -- Evita permitir rangos enormes por error.
  if (family(v_red) = 4 and masklen(v_red) < 24) or (family(v_red) = 6 and masklen(v_red) < 48) then
    raise exception 'La red es demasiado amplia.';
  end if;

  begin
    insert into public.ips_permitidas (etiqueta, red, creado_por)
    values (trim(p_etiqueta), v_red, (select auth.uid()))
    returning id into v_id;
  exception when unique_violation then
    raise exception 'Esa red ya está registrada.';
  end;

  return v_id;
end;
$$;

create function public.cambiar_estado_red(p_id uuid, p_activa boolean)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;
  update public.ips_permitidas set activa = p_activa where id = p_id;
  if not found then
    raise exception 'No encontramos esa red.';
  end if;
end;
$$;

create function public.actualizar_centro(
  p_lat double precision,
  p_lng double precision,
  p_radio_m integer
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
  if p_lat is null or p_lng is null
     or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    raise exception 'La ubicación no es válida.';
  end if;
  if p_radio_m is null or p_radio_m not between 10 and 5000 then
    raise exception 'El radio debe estar entre 10 y 5000 metros.';
  end if;
  update public.centro set lat = p_lat, lng = p_lng, radio_m = p_radio_m where id = 1;
end;
$$;

-- 7) Vistas y horas trabajadas -------------------------------------------------------------------------
-- Marcas válidas. En la parte B se le suman las correcciones aprobadas.
create view public.marcas_efectivas
with (security_invoker = true) as
select
  id,
  empleado_id,
  tipo,
  marcada_en,
  bandera_ubicacion,
  'marca'::text as origen
from public.marcas_asistencia;

-- Marcas con el nombre del empleado (para la pantalla de la administradora).
create view public.marcas_detalle
with (security_invoker = true) as
select
  m.id,
  m.empleado_id,
  p.nombre_completo,
  m.tipo,
  m.marcada_en,
  host(m.ip_origen) as ip_origen,
  m.distancia_m,
  m.precision_m,
  m.bandera_ubicacion
from public.marcas_asistencia m
join public.empleados e on e.id = m.empleado_id
join public.perfiles p on p.id = e.perfil_id;

-- Horas por día: suma cada par entrada -> salida (en hora de Costa Rica).
-- Una entrada sin salida (o una salida sin entrada) deja la jornada como incompleta.
-- Respeta los permisos de quien consulta: la empleada ve solo lo suyo; la administradora, todo.
create function public.jornadas(
  p_desde date,
  p_hasta date,
  p_empleado_id uuid default null
)
returns table (empleado_id uuid, fecha date, minutos integer, incompleta boolean)
language sql
stable
set search_path = ''
as $$
  with m as (
    select
      mk.empleado_id,
      mk.tipo,
      mk.marcada_en,
      lead(mk.tipo) over w as sig_tipo,
      lead(mk.marcada_en) over w as sig_en,
      lag(mk.tipo) over w as ant_tipo
    from public.marcas_efectivas mk
    where (p_empleado_id is null or mk.empleado_id = p_empleado_id)
      and mk.marcada_en >= ((p_desde - 1)::timestamp at time zone 'America/Costa_Rica')
      and mk.marcada_en <  ((p_hasta + 2)::timestamp at time zone 'America/Costa_Rica')
    window w as (partition by mk.empleado_id order by mk.marcada_en)
  ),
  tramos as (
    select
      m.empleado_id,
      (m.marcada_en at time zone 'America/Costa_Rica')::date as fecha,
      case
        when m.tipo = 'entrada' and m.sig_tipo = 'salida'
             and m.sig_en - m.marcada_en <= interval '16 hours'
        then round(extract(epoch from (m.sig_en - m.marcada_en)) / 60)::integer
        else 0
      end as minutos,
      case
        when m.tipo = 'entrada'
        then not (m.sig_tipo = 'salida' and m.sig_en - m.marcada_en <= interval '16 hours')
        else (m.ant_tipo is distinct from 'entrada')
      end as incompleta
    from m
    where m.tipo = 'entrada' or m.ant_tipo is distinct from 'entrada'
  )
  select t.empleado_id, t.fecha, sum(t.minutos)::integer, bool_or(t.incompleta)
  from tramos t
  where t.fecha between p_desde and p_hasta
  group by t.empleado_id, t.fecha;
$$;

-- 8) Seguridad a nivel de fila (RLS) --------------------------------------------------------------------
alter table public.centro enable row level security;
alter table public.ips_permitidas enable row level security;
alter table public.marcas_asistencia enable row level security;

create policy "centro: la administradora lee"
  on public.centro for select to authenticated
  using (public.es_admin());

create policy "redes: la administradora lee"
  on public.ips_permitidas for select to authenticated
  using (public.es_admin());

create policy "marcas: cada persona lee las suyas"
  on public.marcas_asistencia for select to authenticated
  using (
    public.es_usuario_activo()
    and exists (
      select 1 from public.empleados e
      where e.id = empleado_id and e.perfil_id = (select auth.uid())
    )
  );

create policy "marcas: la administradora lee todas"
  on public.marcas_asistencia for select to authenticated
  using (public.es_admin());

-- 9) Permisos de tablas y funciones ---------------------------------------------------------------------
revoke all on table public.centro, public.ips_permitidas, public.marcas_asistencia from anon;
revoke insert, update, delete, truncate
  on table public.centro, public.ips_permitidas, public.marcas_asistencia
  from authenticated;
grant select on table public.centro, public.ips_permitidas, public.marcas_asistencia
  to authenticated;

revoke all on table public.marcas_efectivas, public.marcas_detalle from anon;
grant select on table public.marcas_efectivas, public.marcas_detalle to authenticated;

revoke all on function public.bloquear_cambios_marca() from public, anon, authenticated;
revoke all on function public.anotar_marca_rechazada(uuid, text, inet, public.tipo_marca)
  from public, anon, authenticated;

revoke all on function public.ip_cliente() from public, anon;
revoke all on function public.distancia_metros(double precision, double precision, double precision, double precision)
  from public, anon;
revoke all on function public.registrar_marca(public.tipo_marca, double precision, double precision, real)
  from public, anon;
revoke all on function public.detectar_mi_red() from public, anon;
revoke all on function public.agregar_red_permitida(text, text) from public, anon;
revoke all on function public.cambiar_estado_red(uuid, boolean) from public, anon;
revoke all on function public.actualizar_centro(double precision, double precision, integer)
  from public, anon;
revoke all on function public.jornadas(date, date, uuid) from public, anon;

grant execute on function public.ip_cliente() to authenticated;
grant execute on function public.distancia_metros(double precision, double precision, double precision, double precision)
  to authenticated;
grant execute on function public.registrar_marca(public.tipo_marca, double precision, double precision, real)
  to authenticated;
grant execute on function public.detectar_mi_red() to authenticated;
grant execute on function public.agregar_red_permitida(text, text) to authenticated;
grant execute on function public.cambiar_estado_red(uuid, boolean) to authenticated;
grant execute on function public.actualizar_centro(double precision, double precision, integer)
  to authenticated;
grant execute on function public.jornadas(date, date, uuid) to authenticated;
