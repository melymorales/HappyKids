const ZONA_HORARIA = 'America/Costa_Rica'

function aFecha(valor: string | Date): Date {
  return typeof valor === 'string' ? new Date(valor) : valor
}

/** Fecha corta en hora de Costa Rica (para instantes, por ejemplo una marca de asistencia). */
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

/** Solo la hora, en hora de Costa Rica. */
export function formatoHora(valor: string | Date): string {
  return new Intl.DateTimeFormat('es-CR', {
    timeStyle: 'short',
    timeZone: ZONA_HORARIA,
  }).format(aFecha(valor))
}

/** Fecha de calendario "AAAA-MM-DD" (sin hora), mostrada sin desfase de zona horaria. */
export function formatoFechaCalendario(valor: string): string {
  const [anio, mes, dia] = valor.split('-').map(Number)
  return new Intl.DateTimeFormat('es-CR', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(Date.UTC(anio, mes - 1, dia)),
  )
}

/** Fecha de hoy en Costa Rica como "AAAA-MM-DD". */
export function fechaHoyCR(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_HORARIA }).format(new Date())
}

/** Suma (o resta) días a una fecha "AAAA-MM-DD". */
export function sumarDias(fecha: string, dias: number): string {
  const [anio, mes, dia] = fecha.split('-').map(Number)
  return new Date(Date.UTC(anio, mes - 1, dia + dias)).toISOString().slice(0, 10)
}

/** Instante (ISO) en que empieza ese día en Costa Rica. Costa Rica no usa horario de verano (UTC-6). */
export function inicioDiaCR(fecha: string): string {
  return new Date(`${fecha}T00:00:00-06:00`).toISOString()
}
