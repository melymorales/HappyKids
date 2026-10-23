export type ResultadoUbicacion =
  | { ok: true; lat: number; lng: number; precision_m: number }
  | { ok: false; motivo: 'no_soportado' | 'denegado' | 'no_disponible' | 'tiempo_agotado' }

/** Pide la ubicación al navegador (la persona debe dar permiso). Nunca lanza errores. */
export function obtenerUbicacion(tiempoMaximoMs = 12000): Promise<ResultadoUbicacion> {
  return new Promise((resolver) => {
    if (!('geolocation' in navigator)) {
      resolver({ ok: false, motivo: 'no_soportado' })
      return
    }
    navigator.geolocation.getCurrentPosition(
      (posicion) =>
        resolver({
          ok: true,
          lat: posicion.coords.latitude,
          lng: posicion.coords.longitude,
          precision_m: posicion.coords.accuracy,
        }),
      (error) =>
        resolver({
          ok: false,
          motivo:
            error.code === error.PERMISSION_DENIED
              ? 'denegado'
              : error.code === error.TIMEOUT
                ? 'tiempo_agotado'
                : 'no_disponible',
        }),
      { enableHighAccuracy: true, timeout: tiempoMaximoMs, maximumAge: 0 },
    )
  })
}

export function mensajeUbicacion(motivo: Extract<ResultadoUbicacion, { ok: false }>['motivo']): string {
  switch (motivo) {
    case 'denegado':
      return 'No diste permiso de ubicación. Actívalo en el navegador para que la marca no quede señalada.'
    case 'tiempo_agotado':
      return 'No pudimos obtener tu ubicación a tiempo.'
    case 'no_soportado':
      return 'Este navegador no permite obtener la ubicación.'
    default:
      return 'No pudimos obtener tu ubicación.'
  }
}
