import { formatoColones } from '@/compartido/utilidades/formatoColones'

export type ModalidadPago = 'por_hora' | 'quincena_fija' | 'por_grupo'
export type EstadoPago = 'pendiente' | 'pagada'

const ETIQUETAS: Record<ModalidadPago, string> = {
  por_hora: 'Por hora',
  quincena_fija: 'Salario fijo',
  por_grupo: 'Por grupo',
}

const UNIDADES: Record<ModalidadPago, string> = {
  por_hora: 'por hora',
  quincena_fija: 'por quincena',
  por_grupo: 'por grupo',
}

export function etiquetaModalidad(modalidad: ModalidadPago | null): string {
  return modalidad ? ETIQUETAS[modalidad] : 'Sin tarifa'
}

/** Por ejemplo: "₡2 000 por hora". */
export function textoTarifa(modalidad: ModalidadPago | null, tarifa: number | null): string {
  if (!modalidad || tarifa === null) return '—'
  return `${formatoColones(tarifa)} ${UNIDADES[modalidad]}`
}

/** Fila del cálculo (vista previa) que devuelve `calcular_nomina`. */
export interface FilaCalculo {
  empleado_id: string
  nombre_completo: string
  modalidad_pago: ModalidadPago | null
  tarifa_crc: number | null
  minutos_trabajados: number
  cantidad_grupos: number
  monto_crc: number
  advertencia: string | null
}

/** Fila de la vista `periodos_resumen`. */
export interface Periodo {
  id: string
  fecha_inicio: string
  fecha_fin: string
  creado_en: string
  empleados: number
  total_crc: number
  pendientes: number
}

/** Fila de la vista `nomina_detalle`. */
export interface DetalleNomina {
  id: string
  periodo_id: string
  fecha_inicio: string
  fecha_fin: string
  empleado_id: string
  nombre_completo: string
  modalidad_pago: ModalidadPago | null
  tarifa_crc: number | null
  minutos_trabajados: number
  cantidad_grupos: number
  monto_crc: number
  estado: EstadoPago
  pagada_en: string | null
  /** Solo la administradora recibe las advertencias. */
  advertencias: string | null
}

export interface RegistroGrupos {
  id: string
  empleado_id: string
  fecha: string
  cantidad_grupos: number
  notas: string | null
}

export interface PersonalGrupos {
  id: string
  nombre_completo: string
  activo: boolean
  modalidad_pago: ModalidadPago | null
}
