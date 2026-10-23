export type ModalidadPago = 'por_hora' | 'quincena_fija' | 'por_grupo'

export const MODALIDADES: { valor: ModalidadPago; etiqueta: string; unidad: string }[] = [
  { valor: 'por_hora', etiqueta: 'Por hora', unidad: 'por hora' },
  { valor: 'quincena_fija', etiqueta: 'Salario fijo por quincena', unidad: 'por quincena' },
  { valor: 'por_grupo', etiqueta: 'Por grupo atendido', unidad: 'por grupo' },
]

export function etiquetaModalidad(modalidad: ModalidadPago | null): string {
  return MODALIDADES.find((m) => m.valor === modalidad)?.etiqueta ?? 'Sin modalidad'
}

export function unidadModalidad(modalidad: ModalidadPago | null): string {
  return MODALIDADES.find((m) => m.valor === modalidad)?.unidad ?? ''
}

/** Fila de la vista `empleados_resumen` (incluye la tarifa vigente hoy). */
export interface ResumenEmpleado {
  id: string
  perfil_id: string
  nombre_completo: string
  correo: string
  puesto: string
  fecha_ingreso: string
  activo: boolean
  notas: string | null
  modalidad_pago: ModalidadPago | null
  tarifa_crc: number | null
  vigente_desde: string | null
}

/** Fila de la tabla `tarifas_empleado`. */
export interface TarifaEmpleado {
  id: string
  empleado_id: string
  modalidad_pago: ModalidadPago
  tarifa_crc: number
  vigente_desde: string
  vigente_hasta: string | null
}

/** Valores que escribe la administradora en el formulario de empleado. */
export interface ValoresFormularioEmpleado {
  nombre_completo: string
  correo: string
  puesto: string
  fecha_ingreso: string
  notas: string
  modalidad_pago: ModalidadPago
  tarifa: string
}
