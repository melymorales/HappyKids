const ZONA_HORARIA = 'America/Costa_Rica'

function aFecha(valor: string | Date): Date {
  return typeof valor === 'string' ? new Date(valor) : valor
}

/** Fecha corta en hora de Costa Rica. */
export function formatoFecha(valor: string | Date): string {
  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeZone: ZONA_HORARIA,
  }).format(aFecha(valor))
}

/** Fecha y hora en hora de Costa Rica. */
export function formatoFechaHora(valor: string | Date): string {
  return new Intl.DateTimeFormat('es-CR', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: ZONA_HORARIA,
  }).format(aFecha(valor))
}
