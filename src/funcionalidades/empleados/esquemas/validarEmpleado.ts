import type { ValoresFormularioEmpleado } from '@/funcionalidades/empleados/tipos'

const PATRON_CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PATRON_FECHA = /^\d{4}-\d{2}-\d{2}$/

/**
 * Convierte lo que se escribe ("2000", "80.000", "₡80 000") en un número entero de colones.
 * Devuelve null si no es válido (por ejemplo si trae decimales con coma).
 */
export function convertirTarifa(texto: string): number | null {
  const limpio = texto.replace(/[₡\s.]/g, '')
  if (!/^\d+$/.test(limpio)) return null
  const numero = Number(limpio)
  return Number.isSafeInteger(numero) && numero > 0 ? numero : null
}

const MENSAJE_TARIFA = 'Escribe la tarifa con números enteros, por ejemplo 2000.'

/** Devuelve un mensaje de error, o null si el formulario es válido. */
export function validarEmpleado(
  valores: ValoresFormularioEmpleado,
  modo: 'crear' | 'editar',
): string | null {
  if (valores.nombre_completo.trim() === '') return 'Escribe el nombre completo.'
  if (valores.puesto.trim() === '') return 'Escribe el puesto.'
  if (!PATRON_FECHA.test(valores.fecha_ingreso)) return 'Elige la fecha de ingreso.'
  if (modo === 'crear') {
    if (!PATRON_CORREO.test(valores.correo.trim())) return 'Escribe un correo válido.'
    if (convertirTarifa(valores.tarifa) === null) return MENSAJE_TARIFA
  }
  return null
}

export function validarCorreo(correo: string): string | null {
  return PATRON_CORREO.test(correo.trim()) ? null : 'Escribe un correo válido.'
}

export function validarTarifaNueva(tarifa: string, vigenteDesde: string): string | null {
  if (convertirTarifa(tarifa) === null) return MENSAJE_TARIFA
  if (!PATRON_FECHA.test(vigenteDesde)) return 'Elige desde qué fecha aplica la tarifa.'
  return null
}
