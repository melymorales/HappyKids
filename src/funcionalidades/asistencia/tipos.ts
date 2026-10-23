export type TipoMarca = 'entrada' | 'salida'
export type BanderaUbicacion = 'ok' | 'fuera_de_radio' | 'sin_ubicacion'

/** Una entrada sin salida cuenta como "abierta" durante este número de horas (igual que en la base de datos). */
export const HORAS_MAXIMAS_JORNADA = 16

export interface Marca {
  id: string
  tipo: TipoMarca
  marcada_en: string
  bandera_ubicacion: BanderaUbicacion
}

/** Fila de la vista `marcas_detalle`. */
export interface MarcaDetalle extends Marca {
  empleado_id: string
  nombre_completo: string
  ip_origen: string
  distancia_m: number | null
  precision_m: number | null
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
