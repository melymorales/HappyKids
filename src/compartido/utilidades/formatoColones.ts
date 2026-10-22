const formateador = new Intl.NumberFormat('es-CR', {
  style: 'currency',
  currency: 'CRC',
  maximumFractionDigits: 0,
})

/** Formatea un monto entero en colones, por ejemplo 80000 -> ₡80 000. */
export function formatoColones(monto: number): string {
  return formateador.format(monto)
}
