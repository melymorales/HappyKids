-- Fase 4B: correcciones de marcas, revisión de marcas señaladas y alertas
-- Cómo aplicarla: Supabase > SQL Editor > New query > pegar todo > Run.
-- Requiere haber aplicado antes la fase 4A (y su corrección de jornadas).

-- 1) Tipos -----------------------------------------------------------------------
create type public.tipo_correccion as enum ('agregar', 'anular');
create type public.estado_solicitud as enum ('pendiente', 'aprobada', 'rechazada');
create type public.estado_revision as enum ('revisada_ok', 'revisada_rechazada');

-- 2) Tablas ------------------------------------------------------------------------
-- Pedidos de corrección. Nunca se toca la marca original: una corrección aprobada
-- agrega una marca nueva (agregar) o deja sin efecto una existente (anular).
create table public.correcciones_marca (
  id uuid primary key default gen_random_uuid(),
  empleado_id uuid not null references public.empleados (id) on delete restrict,
  tipo public.tipo_correccion not null,
  marca_objetivo_id uuid references public.marcas_asistencia (id) on delete restrict,
  tipo_marca public.tipo_marca,
  hora_solicitada timestamptz,
  motivo text not null check (char_length(trim(motivo)) >= 5),
  estado public.estado_solicitud not null default 'pendiente',
  solicitada_por uuid references auth.users (id) on delete set null,
  solicitada_en timestamptz not null default now(),
  resuelta_por uuid references auth.users (id) on delete set null,
  resuelta_en timestamptz,
  nota_resolucion text,
  constraint correccion_campos_segun_tipo check (
    (tipo = 'agregar' and tipo_marca is not null and hora_solicitada is not null and marca_objetivo_id is null)
    or
    (tipo = 'anular' and marca_objetivo_id is not null and tipo_marca is null and hora_solicitada is null)
  ),
  constraint correccion_resolucion_coherente check ((estado = 'pendiente') = (resuelta_en is null))
);

-- Una marca solo puede tener una solicitud de anulación vigente.
create unique index correcciones_una_anulacion_por_marca
  on public.correcciones_marca (marca_objetivo_id)
  where tipo = 'anular' and estado in ('pendiente', 'aprobada');

create index correcciones_estado_fecha on public.correcciones_marca (estado, solicitada_en desc);
create index correcciones_empleado_fecha on public.correcciones_marca (empleado_id, solicitada_en desc);

-- Revisión de la administradora sobre una marca señalada (una sola por marca).
create table public.revisiones_marca (
  id uuid primary key default gen_random_uuid(),
  marca_id uuid not null unique references public.marcas_asistencia (id) on delete restrict,
  estado public.estado_revision not null,
  nota text,
  revisada_por uuid references auth.users (id) on delete set null,
  revisada_en timestamptz not null default now()
);

-- 3) Disparadores -------------------------------------------------------------------
-- Una corrección solo puede pasar de "pendiente" a resuelta; nunca se borra ni se reescribe.
create function public.proteger_correccion()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if tg_op = 'DELETE' then
    raise exception 'Las correcciones no se pueden borrar.';
  end if;
  if old.estado <> 'pendiente' then
    raise exception 'Una corrección ya resuelta no se puede modificar.';
  end if;
  if new.empleado_id <> old.empleado_id
     or new.tipo <> old.tipo
     or new.marca_objetivo_id is distinct from old.marca_objetivo_id
     or new.tipo_marca is distinct from old.tipo_marca
     or new.hora_solicitada is distinct from old.hora_solicitada
     or new.motivo <> old.motivo
     or new.solicitada_por is distinct from old.solicitada_por
     or new.solicitada_en <> old.solicitada_en then
    raise exception 'Solo se puede resolver la corrección, no cambiar sus datos.';
  end if;
  return new;
end;
$$;

create trigger correcciones_protegidas
  before update or delete on public.correcciones_marca
  for each row execute function public.proteger_correccion();

create function public.bloquear_cambios_registro()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  raise exception 'Este registro no se puede modificar ni borrar.';
end;
$$;

create trigger revisiones_inalterables
  before update or delete on public.revisiones_marca
  for each row execute function public.bloquear_cambios_registro();

create trigger correcciones_auditoria
  after insert or update on public.correcciones_marca
  for each row execute function public.registrar_auditoria();

create trigger revisiones_auditoria
  after insert or update on public.revisiones_marca
  for each row execute function public.registrar_auditoria();

-- 4) Funciones ------------------------------------------------------------------------
-- Pedir una corrección. La empleada la pide para sí misma (queda "pendiente");
-- la administradora la registra para cualquier empleado y queda aprobada de una vez.
create function public.solicitar_correccion(
  p_tipo public.tipo_correccion,
  p_motivo text,
  p_empleado_id uuid default null,
  p_marca_objetivo_id uuid default null,
  p_tipo_marca public.tipo_marca default null,
  p_hora timestamptz default null
)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_uid uuid := (select auth.uid());
  v_es_admin boolean := public.es_admin();
  v_empleado_id uuid;
  v_marca public.marcas_asistencia%rowtype;
  v_hora timestamptz;
  v_id uuid;
begin
  if v_es_admin then
    v_empleado_id := p_empleado_id;
  else
    select e.id into v_empleado_id
    from public.empleados e
    join public.perfiles p on p.id = e.perfil_id
    where e.perfil_id = v_uid and e.activo and p.activo;
    if v_empleado_id is null then
      raise exception 'Tu cuenta no puede pedir correcciones.' using errcode = '42501';
    end if;
  end if;

  if p_motivo is null or char_length(trim(p_motivo)) < 5 then
    raise exception 'Explica el motivo (al menos 5 caracteres).';
  end if;

  if p_tipo = 'agregar' then
    if v_empleado_id is null then
      raise exception 'Elige al empleado.';
    end if;
    if p_tipo_marca is null or p_hora is null then
      raise exception 'Indica si es entrada o salida, y la fecha y la hora.';
    end if;
    v_hora := date_trunc('minute', p_hora);
    if v_hora > now() then
      raise exception 'La hora no puede estar en el futuro.';
    end if;
    if v_hora < now() - interval '45 days' then
      raise exception 'Solo se pueden corregir marcas de los últimos 45 días.';
    end if;
    if exists (
      select 1 from public.correcciones_marca
      where empleado_id = v_empleado_id and tipo = 'agregar'
        and tipo_marca = p_tipo_marca and hora_solicitada = v_hora
        and estado in ('pendiente', 'aprobada')
    ) then
      raise exception 'Ya existe una corrección igual.';
    end if;
  else
    if p_marca_objetivo_id is null then
      raise exception 'Elige la marca.';
    end if;
    select * into v_marca from public.marcas_asistencia where id = p_marca_objetivo_id;
    if not found then
      raise exception 'No encontramos esa marca.';
    end if;
    if v_empleado_id is null then
      v_empleado_id := v_marca.empleado_id;
    end if;
    if v_marca.empleado_id <> v_empleado_id then
      raise exception 'Esa marca no es de este empleado.';
    end if;
    if v_marca.marcada_en < now() - interval '45 days' then
      raise exception 'Solo se pueden corregir marcas de los últimos 45 días.';
    end if;
    if exists (
      select 1 from public.correcciones_marca
      where tipo = 'anular' and marca_objetivo_id = p_marca_objetivo_id
        and estado in ('pendiente', 'aprobada')
    ) then
      raise exception 'Esa marca ya tiene una solicitud de anulación.';
    end if;
  end if;

  if not exists (select 1 from public.empleados where id = v_empleado_id) then
    raise exception 'No encontramos a ese empleado.';
  end if;

  insert into public.correcciones_marca
    (empleado_id, tipo, marca_objetivo_id, tipo_marca, hora_solicitada, motivo,
     estado, solicitada_por, resuelta_por, resuelta_en, nota_resolucion)
  values (
    v_empleado_id,
    p_tipo,
    case when p_tipo = 'anular' then p_marca_objetivo_id end,
    case when p_tipo = 'agregar' then p_tipo_marca end,
    case when p_tipo = 'agregar' then v_hora end,
    trim(p_motivo),
    case when v_es_admin then 'aprobada'::public.estado_solicitud else 'pendiente'::public.estado_solicitud end,
    v_uid,
    case when v_es_admin then v_uid end,
    case when v_es_admin then now() end,
    case when v_es_admin then 'Registrada por la administradora.' end
  )
  returning id into v_id;

  return v_id;
end;
$$;

-- Aprobar o rechazar una corrección pendiente (solo la administradora).
create function public.resolver_correccion(
  p_id uuid,
  p_aprobar boolean,
  p_comentario text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_correccion public.correcciones_marca%rowtype;
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;

  select * into v_correccion from public.correcciones_marca where id = p_id for update;
  if not found then
    raise exception 'No encontramos esa corrección.';
  end if;
  if v_correccion.estado <> 'pendiente' then
    raise exception 'Esa corrección ya fue resuelta.';
  end if;
  if not p_aprobar and (p_comentario is null or char_length(trim(p_comentario)) < 3) then
    raise exception 'Escribe el motivo del rechazo.';
  end if;

  update public.correcciones_marca
  set estado = case when p_aprobar then 'aprobada'::public.estado_solicitud
                    else 'rechazada'::public.estado_solicitud end,
      resuelta_por = (select auth.uid()),
      resuelta_en = now(),
      nota_resolucion = nullif(trim(coalesce(p_comentario, '')), '')
  where id = p_id;
end;
$$;

-- Revisar una marca señalada: aceptarla o anularla (la anulación queda como corrección aprobada).
create function public.revisar_marca(
  p_marca_id uuid,
  p_aceptar boolean,
  p_nota text default null
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_marca public.marcas_asistencia%rowtype;
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;

  select * into v_marca from public.marcas_asistencia where id = p_marca_id;
  if not found then
    raise exception 'No encontramos esa marca.';
  end if;
  if exists (select 1 from public.revisiones_marca where marca_id = p_marca_id) then
    raise exception 'Esa marca ya fue revisada.';
  end if;
  if not p_aceptar and (p_nota is null or char_length(trim(p_nota)) < 5) then
    raise exception 'Explica por qué se anula la marca (al menos 5 caracteres).';
  end if;

  if not p_aceptar then
    perform public.solicitar_correccion('anular', p_nota, v_marca.empleado_id, p_marca_id);
  end if;

  insert into public.revisiones_marca (marca_id, estado, nota, revisada_por)
  values (
    p_marca_id,
    case when p_aceptar then 'revisada_ok'::public.estado_revision
         else 'revisada_rechazada'::public.estado_revision end,
    nullif(trim(coalesce(p_nota, '')), ''),
    (select auth.uid())
  );
end;
$$;

-- Alertas por patrones raros (solo la administradora).
create function public.alertas_asistencia(p_desde date, p_hasta date)
returns table (empleado_id uuid, fecha date, codigo text, detalle text)
language plpgsql
stable
set search_path = ''
as $$
#variable_conflict use_column
declare
  v_inicio timestamptz := (p_desde::timestamp at time zone 'America/Costa_Rica');
  v_fin timestamptz := ((p_hasta + 1)::timestamp at time zone 'America/Costa_Rica');
begin
  if not public.es_admin() then
    raise exception 'No tienes permiso para esta acción.' using errcode = '42501';
  end if;

  return query
  -- 1) Jornadas incompletas de días que ya pasaron
  select j.empleado_id, j.fecha, 'jornada_incompleta'::text,
         'Falta la entrada o la salida de este día.'::text
  from public.jornadas(p_desde, p_hasta, null) j
  where j.incompleta and j.fecha < public.hoy_cr()

  union all
  -- 2) Jornadas de más de 12 horas
  select j.empleado_id, j.fecha, 'jornada_larga'::text,
         ('Jornada de ' || (j.minutos / 60)::text || ' h ' || lpad((j.minutos % 60)::text, 2, '0') || ' min.')::text
  from public.jornadas(p_desde, p_hasta, null) j
  where j.minutos > 720

  union all
  -- 3) Marcas de madrugada (antes de las 5:00) o de noche (desde las 21:00)
  select m.empleado_id,
         (m.marcada_en at time zone 'America/Costa_Rica')::date,
         'fuera_de_horario'::text,
         ('Marca de ' || m.tipo::text || ' a las '
           || to_char(m.marcada_en at time zone 'America/Costa_Rica', 'HH24:MI') || '.')::text
  from public.marcas_efectivas m
  where m.origen = 'marca'
    and m.marcada_en >= v_inicio and m.marcada_en < v_fin
    and (extract(hour from m.marcada_en at time zone 'America/Costa_Rica') < 5
         or extract(hour from m.marcada_en at time zone 'America/Costa_Rica') >= 21)

  union all
  -- 4) La misma entrada y salida (al minuto) repetida en 5 días o más
  select d.empleado_id, max(d.fecha), 'horas_identicas'::text,
         ('La misma entrada (' || d.ent || ') y salida (' || d.sal || ') se repite en '
           || count(*)::text || ' días.')::text
  from (
    select x.empleado_id, x.fecha,
           to_char(x.entrada at time zone 'America/Costa_Rica', 'HH24:MI') as ent,
           to_char(x.salida at time zone 'America/Costa_Rica', 'HH24:MI') as sal
    from (
      select m.empleado_id,
             (m.marcada_en at time zone 'America/Costa_Rica')::date as fecha,
             min(m.marcada_en) filter (where m.tipo = 'entrada') as entrada,
             max(m.marcada_en) filter (where m.tipo = 'salida') as salida
      from public.marcas_efectivas m
      where m.origen = 'marca'
        and m.marcada_en >= v_inicio and m.marcada_en < v_fin
      group by m.empleado_id, (m.marcada_en at time zone 'America/Costa_Rica')::date
    ) x
    where x.entrada is not null and x.salida is not null
  ) d
  group by d.empleado_id, d.ent, d.sal
  having count(*) >= 5;
end;
$$;

-- 5) Vistas -----------------------------------------------------------------------------
-- Marcas válidas: las marcas no anuladas + las correcciones aprobadas de tipo "agregar".
create or replace view public.marcas_efectivas
with (security_invoker = true) as
select
  m.id,
  m.empleado_id,
  m.tipo,
  m.marcada_en,
  m.bandera_ubicacion,
  'marca'::text as origen
from public.marcas_asistencia m
where not exists (
  select 1 from public.correcciones_marca c
  where c.tipo = 'anular' and c.estado = 'aprobada' and c.marca_objetivo_id = m.id
)
union all
select
  c.id,
  c.empleado_id,
  c.tipo_marca,
  c.hora_solicitada,
  'ok'::text,
  'correccion'::text
from public.correcciones_marca c
where c.tipo = 'agregar' and c.estado = 'aprobada';

-- Marcas con el nombre, y su estado de revisión (se agregan 2 columnas al final).
create or replace view public.marcas_detalle
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
  m.bandera_ubicacion,
  r.estado::text as revision,
  exists (
    select 1 from public.correcciones_marca c
    where c.tipo = 'anular' and c.estado = 'aprobada' and c.marca_objetivo_id = m.id
  ) as anulada
from public.marcas_asistencia m
join public.empleados e on e.id = m.empleado_id
join public.perfiles p on p.id = e.perfil_id
left join public.revisiones_marca r on r.marca_id = m.id;

-- Correcciones con nombres y datos de la marca a la que se refieren.
create view public.correcciones_detalle
with (security_invoker = true) as
select
  c.id,
  c.empleado_id,
  pe.nombre_completo,
  c.tipo,
  c.tipo_marca,
  c.hora_solicitada,
  c.motivo,
  c.estado,
  c.solicitada_en,
  (c.solicitada_por is distinct from e.perfil_id) as creada_por_admin,
  ps.nombre_completo as solicitante,
  c.resuelta_en,
  pr.nombre_completo as resolutor,
  c.nota_resolucion,
  c.marca_objetivo_id,
  t.tipo as marca_tipo,
  t.marcada_en as marca_en
from public.correcciones_marca c
join public.empleados e on e.id = c.empleado_id
left join public.perfiles pe on pe.id = e.perfil_id
left join public.perfiles ps on ps.id = c.solicitada_por
left join public.perfiles pr on pr.id = c.resuelta_por
left join public.marcas_asistencia t on t.id = c.marca_objetivo_id;

-- 6) La secuencia entrada/salida ahora se valida con las marcas válidas (incluye correcciones) ---
create or replace function public.registrar_marca(
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
  v_ultima_tipo public.tipo_marca;
  v_ultima_en timestamptz;
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

  select tipo, marcada_en into v_ultima_tipo, v_ultima_en
  from public.marcas_efectivas
  where empleado_id = v_empleado_id
  order by marcada_en desc
  limit 1;
  v_hay_ultima := found;

  -- Una entrada sin salida cuenta como "abierta" durante 16 horas.
  v_entrada_abierta := v_hay_ultima
    and v_ultima_tipo = 'entrada'
    and v_ultima_en > v_ahora - interval '16 hours';

  if p_tipo = 'entrada' and v_entrada_abierta then
    return jsonb_build_object('ok', false, 'motivo', 'entrada_abierta',
      'mensaje', 'Ya marcaste tu entrada. Si te vas, marca la salida.');
  end if;

  if p_tipo = 'salida' and not v_entrada_abierta then
    return jsonb_build_object('ok', false, 'motivo', 'sin_entrada',
      'mensaje', 'No hay una entrada abierta para marcar la salida. Marca primero la entrada o pide una corrección.');
  end if;

  -- 4) Ubicación: solo sirve de apoyo. Si no cuadra, la marca se guarda pero queda señalada.
  select * into v_centro from public.centro where id = 1;

  if p_lat is null or p_lng is null
     or p_lat not between -90 and 90 or p_lng not between -180 and 180 then
    v_bandera := 'sin_ubicacion';
    v_distancia := null;
  elsif v_centro.lat is null then
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

-- 7) Seguridad a nivel de fila (RLS) ---------------------------------------------------------
alter table public.correcciones_marca enable row level security;
alter table public.revisiones_marca enable row level security;

create policy "correcciones: cada persona lee las suyas"
  on public.correcciones_marca for select to authenticated
  using (
    public.es_usuario_activo()
    and exists (
      select 1 from public.empleados e
      where e.id = empleado_id and e.perfil_id = (select auth.uid())
    )
  );

create policy "correcciones: la administradora lee todas"
  on public.correcciones_marca for select to authenticated
  using (public.es_admin());

create policy "revisiones: la administradora lee"
  on public.revisiones_marca for select to authenticated
  using (public.es_admin());

-- 8) Permisos de tablas y funciones ---------------------------------------------------------------
revoke all on table public.correcciones_marca, public.revisiones_marca from anon;
revoke insert, update, delete, truncate
  on table public.correcciones_marca, public.revisiones_marca from authenticated;
grant select on table public.correcciones_marca, public.revisiones_marca to authenticated;

revoke all on table public.correcciones_detalle from anon;
grant select on table public.correcciones_detalle to authenticated;

revoke all on function public.proteger_correccion() from public, anon, authenticated;
revoke all on function public.bloquear_cambios_registro() from public, anon, authenticated;

revoke all on function public.solicitar_correccion(
  public.tipo_correccion, text, uuid, uuid, public.tipo_marca, timestamptz) from public, anon;
revoke all on function public.resolver_correccion(uuid, boolean, text) from public, anon;
revoke all on function public.revisar_marca(uuid, boolean, text) from public, anon;
revoke all on function public.alertas_asistencia(date, date) from public, anon;

grant execute on function public.solicitar_correccion(
  public.tipo_correccion, text, uuid, uuid, public.tipo_marca, timestamptz) to authenticated;
grant execute on function public.resolver_correccion(uuid, boolean, text) to authenticated;
grant execute on function public.revisar_marca(uuid, boolean, text) to authenticated;
grant execute on function public.alertas_asistencia(date, date) to authenticated;
