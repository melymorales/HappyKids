-- Fase 2: perfiles, roles y permisos base
-- Cómo aplicarla: Supabase > SQL Editor > New query > pegar todo > Run.

-- 1) Tipo de rol --------------------------------------------------------------
create type public.rol_usuario as enum ('admin', 'empleado');

-- 2) Tabla de perfiles (una fila por persona que puede iniciar sesión) ---------
create table public.perfiles (
  id uuid primary key references auth.users (id) on delete cascade,
  rol public.rol_usuario not null default 'empleado',
  nombre_completo text not null check (char_length(trim(nombre_completo)) > 0),
  correo text not null,
  activo boolean not null default true,
  debe_cambiar_clave boolean not null default true,
  creado_en timestamptz not null default now(),
  actualizado_en timestamptz not null default now()
);

comment on table public.perfiles is
  'Datos de acceso y rol de cada usuario. El rol solo lo cambia una administradora.';

-- 3) Funciones auxiliares -------------------------------------------------------
-- Actualiza actualizado_en en cada cambio.
create function public.fijar_actualizado_en()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.actualizado_en = now();
  return new;
end;
$$;

-- Evita quedarse sin ninguna administradora activa.
create function public.proteger_ultima_admin()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if old.rol = 'admin' and old.activo and (new.rol <> 'admin' or not new.activo) then
    if not exists (
      select 1 from public.perfiles
      where rol = 'admin' and activo and id <> old.id
    ) then
      raise exception 'Debe existir al menos una administradora activa.';
    end if;
  end if;
  return new;
end;
$$;

-- ¿La persona que hace la consulta es una administradora activa?
create function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1 from public.perfiles
    where id = (select auth.uid()) and rol = 'admin' and activo
  );
$$;

-- La persona marca que ya cambió su contraseña temporal.
create function public.marcar_clave_cambiada()
returns void
language sql
security definer
set search_path = ''
as $$
  update public.perfiles
  set debe_cambiar_clave = false
  where id = (select auth.uid());
$$;

-- 4) Disparadores ------------------------------------------------------------------
create trigger perfiles_actualizado_en
  before update on public.perfiles
  for each row execute function public.fijar_actualizado_en();

create trigger perfiles_proteger_ultima_admin
  before update on public.perfiles
  for each row execute function public.proteger_ultima_admin();

-- 5) Seguridad a nivel de fila (RLS) -------------------------------------------------
alter table public.perfiles enable row level security;

create policy "perfiles: cada persona lee el suyo"
  on public.perfiles for select to authenticated
  using (id = (select auth.uid()));

create policy "perfiles: la administradora lee todos"
  on public.perfiles for select to authenticated
  using (public.es_admin());

create policy "perfiles: la administradora actualiza"
  on public.perfiles for update to authenticated
  using (public.es_admin())
  with check (public.es_admin());

-- No hay política de insert ni de delete: los perfiles se crean desde el servidor
-- (función crear-usuario, fase 3) o desde el SQL Editor, y nunca se borran.

-- 6) Permisos de ejecución y de tabla ------------------------------------------------
revoke all on table public.perfiles from anon;
revoke delete, truncate on table public.perfiles from authenticated;
grant select, update on table public.perfiles to authenticated;

revoke all on function public.fijar_actualizado_en() from public, anon, authenticated;
revoke all on function public.proteger_ultima_admin() from public, anon, authenticated;
revoke all on function public.es_admin() from public, anon;
revoke all on function public.marcar_clave_cambiada() from public, anon;
grant execute on function public.es_admin() to authenticated;
grant execute on function public.marcar_clave_cambiada() to authenticated;
