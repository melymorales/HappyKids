-- Corrección de la fase 4A: una entrada sin salida debe dejar la jornada como INCOMPLETA.
-- Antes, la comparación con "sig_tipo = 'salida'" daba NULL (sin valor) y la jornada aparecía como completa.
-- Cómo aplicarla: Supabase > SQL Editor > New query > pegar todo > Run.

create or replace function public.jornadas(
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
        when m.tipo = 'entrada'
             and coalesce(m.sig_tipo = 'salida' and m.sig_en - m.marcada_en <= interval '16 hours', false)
        then round(extract(epoch from (m.sig_en - m.marcada_en)) / 60)::integer
        else 0
      end as minutos,
      case
        when m.tipo = 'entrada'
        then not coalesce(m.sig_tipo = 'salida' and m.sig_en - m.marcada_en <= interval '16 hours', false)
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
