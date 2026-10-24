export type TipoMarca = 'entrada' | 'salida'
export type BanderaUbicacion = 'ok' | 'fuera_de_radio' | 'sin_ubicacion'
export type TipoCorreccion = 'agregar' | 'anular'
export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada'

/** Una entrada sin salida cuenta como "abierta" durante este número de horas (igual que en la base de datos). */
export const HORAS_MAXIMAS_JORNADA = 16

/** Marca válida (viene de la vista `marcas_efectivas`). */
export interface Marca {
  id: string
  tipo: TipoMarca
  marcada_en: string
  bandera_ubicacion: BanderaUbicacion
  /** "marca" = hecha por la persona; "correccion" = agregada por una corrección aprobada. */
  origen: 'marca' | 'correccion'
}

/** Fila de la vista `marcas_detalle`. */
export interface MarcaDetalle {
  id: string
  empleado_id: string
  nombre_completo: string
  tipo: TipoMarca
  marcada_en: string
  bandera_ubicacion: BanderaUbicacion
  ip_origen: string
  distancia_m: number | null
  precision_m: number | null
  revision: 'revisada_ok' | 'revisada_rechazada' | null
  anulada: boolean
}

export interface Jornada {
  empleado_id: string
  fecha: string
  minutos: number
  incompleta: boolean
}

export interface PosicionMarca {
  lat: number
  lng: number
  precision_m: number
}

export type RespuestaMarca =
  | { ok: true; tipo: TipoMarca; marcada_en: string; bandera: BanderaUbicacion }
  | { ok: false; motivo: string; mensaje: string }

export interface Centro {
  nombre: string
  lat: number | null
  lng: number | null
  radio_m: number
}

export interface RedPermitida {
  id: string
  etiqueta: string
  red: string
  activa: boolean
  creado_en: string
}

export type DeteccionRed =
  | { ok: true; ip: string; red: string; version: number }
  | { ok: false; mensaje: string }

export interface PersonalSimple {
  id: string
  nombre_completo: string
  activo: boolean
}

/** Fila de la vista `correcciones_detalle`. */
export interface Correccion {
  id: string
  empleado_id: string
  nombre_completo: string | null
  tipo: TipoCorreccion
  tipo_marca: TipoMarca | null
  hora_solicitada: string | null
  motivo: string
  estado: EstadoSolicitud
  solicitada_en: string
  creada_por_admin: boolean
  solicitante: string | null
  resuelta_en: string | null
  resolutor: string | null
  nota_resolucion: string | null
  marca_objetivo_id: string | null
  marca_tipo: TipoMarca | null
  marca_en: string | null
}

export type CodigoAlerta = 'jornada_incompleta' | 'jornada_larga' | 'fuera_de_horario' | 'horas_identicas'

export interface AlertaAsistencia {
  empleado_id: string
  fecha: string
  codigo: CodigoAlerta
  detalle: string
}

export interface DatosSolicitudCorreccion {
  tipo: TipoCorreccion
  motivo: string
  empleadoId?: string | null
  marcaObjetivoId?: string | null
  tipoMarca?: TipoMarca | null
  /** Instante (ISO) de la marca que se quiere agregar. */
  hora?: string | null
}

export interface ConteosPendientes {
  correcciones: number
  porRevisar: number
}

/** Fila de la vista `revisiones_detalle` (historial de marcas revisadas). */
export interface RevisionMarca {
  id: string
  marca_id: string
  empleado_id: string
  nombre_completo: string
  tipo: TipoMarca
  marcada_en: string
  bandera_ubicacion: BanderaUbicacion
  distancia_m: number | null
  precision_m: number | null
  estado: 'revisada_ok' | 'revisada_rechazada'
  nota: string | null
  revisada_en: string
  revisor: string | null
}
