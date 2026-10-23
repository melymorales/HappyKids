import { obtenerClienteSupabase } from '@/nucleo/supabase/clienteSupabase'
import { invocarFuncion } from '@/nucleo/supabase/invocarFuncion'
import type { ModalidadPago, ResumenEmpleado, TarifaEmpleado } from '@/funcionalidades/empleados/tipos'

interface ErrorBase {
  message: string
  code?: string
}

/** Los mensajes que escribimos en la base de datos (código P0001) ya están en español. */
function mensajeDe(error: ErrorBase, porDefecto: string): string {
  if (error.code === 'P0001') return error.message
  if (error.code === '42501') return 'No tienes permiso para hacer esto.'
  return porDefecto
}

// ----------------------------- Lectura -----------------------------

export async function listarEmpleados(): Promise<ResumenEmpleado[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('empleados_resumen')
    .select('*')
    .order('nombre_completo', { ascending: true })
  if (error) throw new Error('No pudimos cargar los empleados.')
  return (data ?? []) as ResumenEmpleado[]
}

export async function obtenerEmpleado(id: string): Promise<ResumenEmpleado | null> {
  const { data, error } = await obtenerClienteSupabase()
    .from('empleados_resumen')
    .select('*')
    .eq('id', id)
    .maybeSingle()
  if (error) throw new Error('No pudimos cargar al empleado.')
  return (data as ResumenEmpleado | null) ?? null
}

/** Para un empleado con sesión: la vista solo le devuelve su propio registro. */
export async function obtenerMiEmpleado(): Promise<ResumenEmpleado | null> {
  const { data, error } = await obtenerClienteSupabase()
    .from('empleados_resumen')
    .select('*')
    .limit(1)
    .maybeSingle()
  if (error) throw new Error('No pudimos cargar tu perfil.')
  return (data as ResumenEmpleado | null) ?? null
}

export async function listarTarifas(empleadoId: string): Promise<TarifaEmpleado[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('tarifas_empleado')
    .select('id, empleado_id, modalidad_pago, tarifa_crc, vigente_desde, vigente_hasta')
    .eq('empleado_id', empleadoId)
    .order('vigente_desde', { ascending: false })
  if (error) throw new Error('No pudimos cargar las tarifas.')
  return (data ?? []) as TarifaEmpleado[]
}

// ---------------------------- Escritura ----------------------------

export interface DatosNuevoEmpleado {
  correo: string
  nombre_completo: string
  puesto: string
  fecha_ingreso: string
  modalidad_pago: ModalidadPago
  tarifa_crc: number
  notas: string
}

export interface ResultadoCrearEmpleado {
  empleado_id: string
  clave_temporal: string
}

/** Crea el acceso, el perfil, el empleado y su primera tarifa (función de servidor). */
export function crearEmpleado(datos: DatosNuevoEmpleado): Promise<ResultadoCrearEmpleado> {
  return invocarFuncion<ResultadoCrearEmpleado>('gestionar-usuarios', { accion: 'crear', ...datos })
}

export function restablecerClaveEmpleado(perfilId: string): Promise<{ clave_temporal: string }> {
  return invocarFuncion<{ clave_temporal: string }>('gestionar-usuarios', {
    accion: 'restablecer_clave',
    perfil_id: perfilId,
  })
}

export function cambiarCorreoEmpleado(perfilId: string, correo: string): Promise<{ ok: boolean }> {
  return invocarFuncion<{ ok: boolean }>('gestionar-usuarios', {
    accion: 'cambiar_correo',
    perfil_id: perfilId,
    correo,
  })
}

export interface DatosEdicionEmpleado {
  id: string
  nombre_completo: string
  puesto: string
  fecha_ingreso: string
  notas: string
}

export async function actualizarEmpleado(datos: DatosEdicionEmpleado): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('actualizar_empleado', {
    p_empleado_id: datos.id,
    p_nombre_completo: datos.nombre_completo,
    p_puesto: datos.puesto,
    p_fecha_ingreso: datos.fecha_ingreso,
    p_notas: datos.notas,
  })
  if (error) throw new Error(mensajeDe(error, 'No pudimos guardar los cambios.'))
}

export async function cambiarEstadoEmpleado(id: string, activo: boolean): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('cambiar_estado_empleado', {
    p_empleado_id: id,
    p_activo: activo,
  })
  if (error) throw new Error(mensajeDe(error, 'No pudimos cambiar el estado del empleado.'))
}

export interface DatosNuevaTarifa {
  empleado_id: string
  modalidad_pago: ModalidadPago
  tarifa_crc: number
  vigente_desde: string
}

export async function agregarTarifa(datos: DatosNuevaTarifa): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('agregar_tarifa', {
    p_empleado_id: datos.empleado_id,
    p_modalidad_pago: datos.modalidad_pago,
    p_tarifa_crc: datos.tarifa_crc,
    p_vigente_desde: datos.vigente_desde,
  })
  if (error) throw new Error(mensajeDe(error, 'No pudimos guardar la tarifa.'))
}
