-- Historial de revisiones de marcas (pantalla "Por revisar" de la administradora)
-- Cómo aplicarla: Supabase > SQL Editor > New query > pegar todo > Run.

-- Revisiones con el nombre del empleado, los datos de la marca y quién la revisó.
create view public.revisiones_detalle
with (security_invoker = true) as
select
  r.id,
  r.marca_id,
  m.empleado_id,
  p.nombre_completo,
  m.tipo,
  m.marcada_en,
  m.bandera_ubicacion,
  m.distancia_m,
  m.precision_m,
  r.estado::text as estado,
  r.nota,
  r.revisada_en,
  pr.nombre_completo as revisor
from public.revisiones_marca r
join public.marcas_asistencia m on m.id = r.marca_id
join public.empleados e on e.id = m.empleado_id
join public.perfiles p on p.id = e.perfil_id
left join public.perfiles pr on pr.id = r.revisada_por;

revoke all on table public.revisiones_detalle from anon;
grant select on table public.revisiones_detalle to authenticated;
