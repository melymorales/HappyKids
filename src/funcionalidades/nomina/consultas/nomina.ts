import { obtenerClienteSupabase } from '@/nucleo/supabase/clienteSupabase'
import { mensajeDeError } from '@/nucleo/supabase/mensajesError'
import type {
  DetalleNomina,
  FilaCalculo,
  PersonalGrupos,
  Periodo,
  RegistroGrupos,
} from '@/funcionalidades/nomina/tipos'

// ------------------------------ Administradora ------------------------------

/** Vista previa del cálculo de una quincena (no guarda nada). */
export async function calcularNomina(desde: string, hasta: string): Promise<FilaCalculo[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('calcular_nomina', {
    p_desde: desde,
    p_hasta: hasta,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos calcular la quincena.'))
  return (data ?? []) as FilaCalculo[]
}

/** Guarda la quincena y devuelve su identificador. */
export async function guardarPeriodo(datos: { desde: string; hasta: string }): Promise<string> {
  const { data, error } = await obtenerClienteSupabase().rpc('guardar_periodo_nomina', {
    p_desde: datos.desde,
    p_hasta: datos.hasta,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos guardar la quincena.'))
  return data as string
}

export async function listarPeriodos(): Promise<Periodo[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('periodos_resumen')
    .select('*')
    .order('fecha_inicio', { ascending: false })
    .limit(60)
  if (error) throw new Error('No pudimos cargar las quincenas.')
  return (data ?? []) as Periodo[]
}

export async function obtenerPeriodo(id: string): Promise<Periodo | null> {
  const { data, error } = await obtenerClienteSupabase()
    .from('periodos_resumen')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('No pudimos cargar la quincena.')
  return (data as Periodo | null) ?? null
}

export async function listarDetallePeriodo(periodoId: string): Promise<DetalleNomina[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('nomina_detalle')
    .select('*')
    .eq('periodo_id', periodoId)
    .order('nombre_completo', { ascending: true })
  if (error) throw new Error('No pudimos cargar el detalle de la quincena.')
  return (data ?? []) as DetalleNomina[]
}

export async function marcarDetallePagado(datos: {
  id: string
  pagada: boolean
  fecha: string | null
}): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('marcar_detalle_pagado', {
    p_detalle_id: datos.id,
    p_pagada: datos.pagada,
    p_fecha: datos.fecha,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos actualizar el pago.'))
}

export async function marcarPeriodoPagado(datos: { periodoId: string; fecha: string }): Promise<number> {
  const { data, error } = await obtenerClienteSupabase().rpc('marcar_periodo_pagado', {
    p_periodo_id: datos.periodoId,
    p_fecha: datos.fecha,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos actualizar los pagos.'))
  return (data as number | null) ?? 0
}

export async function registrarGrupos(datos: {
  empleadoId: string
  fecha: string
  cantidad: number
  notas: string
}): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('registrar_grupos', {
    p_empleado_id: datos.empleadoId,
    p_fecha: datos.fecha,
    p_cantidad: datos.cantidad,
    p_notas: datos.notas === '' ? null : datos.notas,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos guardar los grupos.'))
}

export async function listarGrupos(desde: string, hasta: string): Promise<RegistroGrupos[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('registro_grupos')
    .select('id, empleado_id, fecha, cantidad_grupos, notas')
    .gte('fecha', desde)
    .lte('fecha', hasta)
    .order('fecha', { ascending: false })
    .limit(300)
  if (error) throw new Error('No pudimos cargar los grupos.')
  return (data ?? []) as RegistroGrupos[]
}

/** Personal con su modalidad de pago actual (para elegir a quién registrarle grupos). */
export async function listarPersonalGrupos(): Promise<PersonalGrupos[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('empleados_resumen')
    .select('id, nombre_completo, activo, modalidad_pago')
    .order('nombre_completo', { ascending: true })
  if (error) throw new Error('No pudimos cargar a los empleados.')
  return (data ?? []) as PersonalGrupos[]
}

// --------------------------------- Empleadas ---------------------------------

/** Quincenas guardadas de la persona (la base de datos solo le devuelve las suyas). */
export async function listarMisQuincenas(): Promise<DetalleNomina[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('nomina_detalle')
    .select('*')
    .order('fecha_inicio', { ascending: false })
    .limit(60)
  if (error) throw new Error('No pudimos cargar tus quincenas.')
  return (data ?? []) as DetalleNomina[]
}
