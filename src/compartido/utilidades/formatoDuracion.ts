/** 425 -> "7 h 05 min". */
export function formatoDuracion(minutos: number): string {
  if (minutos <= 0) return '0 min'
  const horas = Math.floor(minutos / 60)
  const resto = minutos % 60
  if (horas === 0) return `${resto} min`
  return `${horas} h ${String(resto).padStart(2, '0')} min`
}
