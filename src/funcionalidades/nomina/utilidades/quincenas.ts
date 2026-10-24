function dos(numero: number): string {
  return String(numero).padStart(2, '0')
}

/**
 * Última quincena que ya terminó, según la fecha de hoy ("AAAA-MM-DD").
 * Las quincenas son del 1 al 15 y del 16 al último día del mes.
 */
export function ultimaQuincenaTerminada(hoy: string): { desde: string; hasta: string } {
  const [anio, mes, dia] = hoy.split('-').map(Number)
  if (dia >= 16) {
    return { desde: `${anio}-${dos(mes)}-01`, hasta: `${anio}-${dos(mes)}-15` }
  }
  // Día 0 del mes actual = último día del mes anterior.
  const finMesAnterior = new Date(Date.UTC(anio, mes - 1, 0))
  const a = finMesAnterior.getUTCFullYear()
  const m = finMesAnterior.getUTCMonth() + 1
  const d = finMesAnterior.getUTCDate()
  return { desde: `${a}-${dos(m)}-16`, hasta: `${a}-${dos(m)}-${dos(d)}` }
}
