import { inicioDiaCR, sumarDias } from '@/compartido/utilidades/formatoFechas'
import { obtenerClienteSupabase } from '@/nucleo/supabase/clienteSupabase'
import { mensajeDeError } from '@/nucleo/supabase/mensajesError'
import type {
  AlertaAsistencia,
  Centro,
  ConteosPendientes,
  Correccion,
  DatosSolicitudCorreccion,
  DeteccionRed,
  Jornada,
  Marca,
  MarcaDetalle,
  PersonalSimple,
  PosicionMarca,
  RedPermitida,
  RespuestaMarca,
  RevisionMarca,
  TipoMarca,
} from '@/funcionalidades/asistencia/tipos'

// ------------------------------- Empleadas -------------------------------

export async function registrarMarca(
  tipo: TipoMarca,
  posicion: PosicionMarca | null,
): Promise<RespuestaMarca> {
  const { data, error } = await obtenerClienteSupabase().rpc('registrar_marca', {
    p_tipo: tipo,
    p_lat: posicion?.lat ?? null,
    p_lng: posicion?.lng ?? null,
    p_precision_m: posicion?.precision_m ?? null,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos registrar tu marca. Inténtalo de nuevo.'))
  return data as RespuestaMarca
}

/** Marcas válidas de la persona (incluye las agregadas por correcciones aprobadas). */
export async function listarMisMarcas(): Promise<Marca[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('marcas_efectivas')
    .select('id, tipo, marcada_en, bandera_ubicacion, origen')
    .order('marcada_en', { ascending: false })
    .limit(20)
  if (error) throw new Error('No pudimos cargar tus marcas.')
  return (data ?? []) as Marca[]
}

export async function listarMisCorrecciones(): Promise<Correccion[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('correcciones_detalle')
    .select('*')
    .order('solicitada_en', { ascending: false })
    .limit(50)
  if (error) throw new Error('No pudimos cargar tus solicitudes.')
  return (data ?? []) as Correccion[]
}

/** Horas por día. Sin `empleadoId`, devuelve las de todas las personas que el usuario puede ver. */
export async function listarJornadas(
  desde: string,
  hasta: string,
  empleadoId: string | null,
): Promise<Jornada[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('jornadas', {
    p_desde: desde,
    p_hasta: hasta,
    p_empleado_id: empleadoId,
  })
  if (error) throw new Error('No pudimos cargar las horas trabajadas.')
  return (data ?? []) as Jornada[]
}

/** La empleada pide una corrección; la administradora la registra y queda aprobada. */
export async function solicitarCorreccion(datos: DatosSolicitudCorreccion): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('solicitar_correccion', {
    p_tipo: datos.tipo,
    p_motivo: datos.motivo,
    p_empleado_id: datos.empleadoId ?? null,
    p_marca_objetivo_id: datos.marcaObjetivoId ?? null,
    p_tipo_marca: datos.tipoMarca ?? null,
    p_hora: datos.hora ?? null,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos enviar la solicitud. Inténtalo de nuevo.'))
}

// ----------------------------- Administradora -----------------------------

export async function listarMarcasDetalle(
  desde: string,
  hasta: string,
  empleadoId: string | null,
): Promise<MarcaDetalle[]> {
  const base = obtenerClienteSupabase()
    .from('marcas_detalle')
    .select('*')
    .gte('marcada_en', inicioDiaCR(desde))
    .lt('marcada_en', inicioDiaCR(sumarDias(hasta, 1)))
    .order('marcada_en', { ascending: false })
    .limit(500)
  const consulta = empleadoId ? base.eq('empleado_id', empleadoId) : base
  const { data, error } = await consulta
  if (error) throw new Error('No pudimos cargar las marcas.')
  return (data ?? []) as MarcaDetalle[]
}

/** Marcas señaladas (fuera del radio o sin ubicación) que todavía no se revisaron. */
export async function listarMarcasPorRevisar(): Promise<MarcaDetalle[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('marcas_detalle')
    .select('*')
    .neq('bandera_ubicacion', 'ok')
    .is('revision', null)
    .eq('anulada', false)
    .order('marcada_en', { ascending: false })
    .limit(200)
  if (error) throw new Error('No pudimos cargar las marcas por revisar.')
  return (data ?? []) as MarcaDetalle[]
}

export async function revisarMarca(datos: { marcaId: string; aceptar: boolean; nota: string }): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('revisar_marca', {
    p_marca_id: datos.marcaId,
    p_aceptar: datos.aceptar,
    p_nota: datos.nota === '' ? null : datos.nota,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos guardar la revisión.'))
}

export async function listarCorrecciones(filtro: 'pendientes' | 'resueltas'): Promise<Correccion[]> {
  const base = obtenerClienteSupabase().from('correcciones_detalle').select('*')
  const consulta =
    filtro === 'pendientes'
      ? base.eq('estado', 'pendiente').order('solicitada_en', { ascending: true })
      : base.neq('estado', 'pendiente').order('resuelta_en', { ascending: false }).limit(100)
  const { data, error } = await consulta
  if (error) throw new Error('No pudimos cargar las correcciones.')
  return (data ?? []) as Correccion[]
}

export async function resolverCorreccion(datos: { id: string; aprobar: boolean; comentario: string }): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('resolver_correccion', {
    p_id: datos.id,
    p_aprobar: datos.aprobar,
    p_comentario: datos.comentario === '' ? null : datos.comentario,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos resolver la corrección.'))
}

export async function listarAlertas(desde: string, hasta: string): Promise<AlertaAsistencia[]> {
  const { data, error } = await obtenerClienteSupabase().rpc('alertas_asistencia', {
    p_desde: desde,
    p_hasta: hasta,
  })
  if (error) throw new Error('No pudimos cargar las alertas.')
  return (data ?? []) as AlertaAsistencia[]
}

export async function contarPendientes(): Promise<ConteosPendientes> {
  const cliente = obtenerClienteSupabase()
  const [correcciones, porRevisar] = await Promise.all([
    cliente.from('correcciones_marca').select('id', { count: 'exact', head: true }).eq('estado', 'pendiente'),
    cliente
      .from('marcas_detalle')
      .select('id', { count: 'exact', head: true })
      .neq('bandera_ubicacion', 'ok')
      .is('revision', null)
      .eq('anulada', false),
  ])
  if (correcciones.error || porRevisar.error) throw new Error('No pudimos cargar los pendientes.')
  return { correcciones: correcciones.count ?? 0, porRevisar: porRevisar.count ?? 0 }
}

/** Lista de personas para los filtros (se lee de la vista de empleados). */
export async function listarPersonal(): Promise<PersonalSimple[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('empleados_resumen')
    .select('id, nombre_completo, activo')
    .order('nombre_completo', { ascending: true })
  if (error) throw new Error('No pudimos cargar a los empleados.')
  return (data ?? []) as PersonalSimple[]
}

export async function obtenerCentro(): Promise<Centro | null> {
  const { data, error } = await obtenerClienteSupabase()
    .from('centro')
    .select('nombre, lat, lng, radio_m')
    .eq('id', 1)
    .maybeSingle()
  if (error) throw new Error('No pudimos cargar la ubicación del kínder.')
  return (data as Centro | null) ?? null
}

export async function actualizarCentro(datos: { lat: number; lng: number; radio_m: number }): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('actualizar_centro', {
    p_lat: datos.lat,
    p_lng: datos.lng,
    p_radio_m: datos.radio_m,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos guardar la ubicación.'))
}

export async function listarRedes(): Promise<RedPermitida[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('ips_permitidas')
    .select('id, etiqueta, red, activa, creado_en')
    .order('creado_en', { ascending: false })
  if (error) throw new Error('No pudimos cargar las redes permitidas.')
  return (data ?? []) as RedPermitida[]
}

export async function detectarMiRed(): Promise<DeteccionRed> {
  const { data, error } = await obtenerClienteSupabase().rpc('detectar_mi_red')
  if (error) throw new Error(mensajeDeError(error, 'No pudimos detectar tu red.'))
  return data as DeteccionRed
}

export async function agregarRed(datos: { etiqueta: string; red: string }): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('agregar_red_permitida', {
    p_etiqueta: datos.etiqueta,
    p_red: datos.red,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos guardar la red.'))
}

export async function cambiarEstadoRed(id: string, activa: boolean): Promise<void> {
  const { error } = await obtenerClienteSupabase().rpc('cambiar_estado_red', {
    p_id: id,
    p_activa: activa,
  })
  if (error) throw new Error(mensajeDeError(error, 'No pudimos cambiar el estado de la red.'))
}

/** Marcas que ya se revisaron (aceptadas o anuladas), de la más reciente a la más antigua. */
export async function listarHistorialRevisiones(): Promise<RevisionMarca[]> {
  const { data, error } = await obtenerClienteSupabase()
    .from('revisiones_detalle')
    .select('*')
    .order('revisada_en', { ascending: false })
    .limit(100)
  if (error) throw new Error('No pudimos cargar el historial de revisiones.')
  return (data ?? []) as RevisionMarca[]
}
