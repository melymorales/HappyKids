import { useState } from 'react'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { mensajeUbicacion, obtenerUbicacion } from '@/compartido/utilidades/geolocalizacion'
import { useActualizarCentro } from '@/funcionalidades/asistencia/ganchos/useAccionesAsistencia'
import type { Centro } from '@/funcionalidades/asistencia/tipos'

interface Props {
  centro: Centro
}

interface Detectada {
  lat: number
  lng: number
  precision_m: number
}

export function SeccionUbicacionCentro({ centro }: Props) {
  const actualizar = useActualizarCentro()
  const [detectada, setDetectada] = useState<Detectada | null>(null)
  const [detectando, setDetectando] = useState(false)
  const [radio, setRadio] = useState(String(centro.radio_m))
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function detectar() {
    setError(null)
    setAviso(null)
    setDetectando(true)
    const ubicacion = await obtenerUbicacion(20000)
    setDetectando(false)
    if (!ubicacion.ok) {
      setError(mensajeUbicacion(ubicacion.motivo))
      return
    }
    setDetectada({ lat: ubicacion.lat, lng: ubicacion.lng, precision_m: ubicacion.precision_m })
  }

  async function guardar() {
    const radioNumero = Number(radio)
    if (!Number.isInteger(radioNumero) || radioNumero < 10 || radioNumero > 5000) {
      setError('El radio debe ser un número entero entre 10 y 5000 metros.')
      return
    }
    const lat = detectada?.lat ?? centro.lat
    const lng = detectada?.lng ?? centro.lng
    if (lat === null || lng === null) {
      setError('Primero detecta tu ubicación actual estando en el kínder.')
      return
    }
    setError(null)
    try {
      await actualizar.mutateAsync({ lat, lng, radio_m: radioNumero })
      setDetectada(null)
      setAviso('Ubicación guardada.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar la ubicación.')
    }
  }

  return (
    <Tarjeta titulo="Ubicación del kínder">
      {centro.lat === null || centro.lng === null ? (
        <p className="mb-4 rounded-xl bg-pastel-mantequilla px-4 py-3 text-sm">
          Todavía no registraste la ubicación del kínder. Mientras tanto, el sistema no puede comparar la
          ubicación de las marcas.
        </p>
      ) : (
        <p className="mb-4">
          Ubicación guardada: {centro.lat.toFixed(5)}, {centro.lng.toFixed(5)}. Radio permitido:{' '}
          <strong>{centro.radio_m} m</strong>.
        </p>
      )}

      <p className="mb-3 text-sm text-suave">
        Para registrarla, abre esta pantalla <strong>estando dentro del kínder</strong> y pulsa el botón. El
        navegador te pedirá permiso de ubicación.
      </p>

      <div className="flex flex-col gap-4">
        <div>
          <BotonSecundario alPulsar={() => void detectar()} deshabilitado={detectando}>
            {detectando ? 'Detectando…' : 'Usar mi ubicación actual'}
          </BotonSecundario>
        </div>

        {detectada && (
          <p role="status" className="rounded-xl bg-pastel-cielo px-4 py-3 text-sm">
            Ubicación detectada: {detectada.lat.toFixed(5)}, {detectada.lng.toFixed(5)} (precisión de unos{' '}
            {Math.round(detectada.precision_m)} m). Si no estás en el kínder, no la guardes.
          </p>
        )}

        <CampoTexto
          id="radio"
          etiqueta="Radio permitido (metros)"
          valor={radio}
          alCambiar={setRadio}
          modoEntrada="numeric"
          ayuda="Recomendado: 100 m. En interiores el GPS puede variar entre 10 y 50 m."
        />

        <div aria-live="polite" className="flex flex-col gap-3">
          {error && (
            <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
              {error}
            </p>
          )}
          {aviso && (
            <p role="status" className="rounded-xl bg-pastel-menta px-4 py-3 text-sm">
              {aviso}
            </p>
          )}
        </div>

        <BotonPrincipal tipo="button" alPulsar={() => void guardar()} deshabilitado={actualizar.isPending}>
          {actualizar.isPending ? 'Guardando…' : 'Guardar ubicación'}
        </BotonPrincipal>
      </div>
    </Tarjeta>
  )
}
