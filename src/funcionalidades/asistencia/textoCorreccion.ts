import { formatoFechaHora } from '@/compartido/utilidades/formatoFechas'
import type { Correccion } from '@/funcionalidades/asistencia/tipos'

/** Descripción corta de lo que pide una corrección. */
export function describirCorreccion(c: Correccion): string {
  if (c.tipo === 'agregar' && c.hora_solicitada && c.tipo_marca) {
    return `Agregar ${c.tipo_marca === 'entrada' ? 'una entrada' : 'una salida'} el ${formatoFechaHora(c.hora_solicitada)}`
  }
  if (c.tipo === 'anular' && c.marca_en && c.marca_tipo) {
    return `Anular la ${c.marca_tipo === 'entrada' ? 'entrada' : 'salida'} del ${formatoFechaHora(c.marca_en)}`
  }
  return 'Corrección'
}
