import { useState } from 'react'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
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
  const [abierta, setAbierta] = useState(false)
  const [detectada, setDetectada] = useState<Detectada | null>(null)
  const [detectando, setDetectando] = useState(false)
  const [radio, setRadio] = useState(String(centro.radio_m))
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  const hayUbicacion = centro.lat !== null && centro.lng !== null

  function abrir() {
    setRadio(String(centro.radio_m))
    setDetectada(null)
    setError(null)
    setAviso(null)
    setAbierta(true)
  }

  function cancelar() {
    setAbierta(false)
    setDetectada(null)
    setError(null)
  }

  async function detectar() {
    setError(null)
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
      setError('Primero pulsa "Usar mi ubicación actual" estando en el kínder.')
      return
    }
    setError(null)
    try {
      await actualizar.mutateAsync({ lat, lng, radio_m: radioNumero })
      setAbierta(false)
      setDetectada(null)
      setAviso('Ubicación guardada.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar la ubicación.')
    }
  }

  return (
    <Tarjeta titulo="Ubicación del kínder">
      {hayUbicacion ? (
        <div className="rounded-2xl border-2 border-verde bg-pastel-menta p-4">
          <p className="font-semibold">Ubicación guardada</p>
          <p className="mt-1 break-words text-sm">
            Coordenadas: {centro.lat?.toFixed(5)}, {centro.lng?.toFixed(5)}
          </p>
          <p className="text-sm">
            Radio permitido: <strong>{centro.radio_m} m</strong>
          </p>
        </div>
      ) : (
        <p className="rounded-xl bg-pastel-mantequilla px-4 py-3 text-sm">
          Todavía no registraste la ubicación del kínder. Mientras tanto, el sistema no puede comparar la
          ubicación de las marcas.
        </p>
      )}

      <div aria-live="polite">
        {aviso && (
          <p role="status" className="mt-4 rounded-xl bg-pastel-menta px-4 py-3 text-sm">
            {aviso}
          </p>
        )}
      </div>

      {!abierta && (
        <div className="mt-4">
          <BotonMorado alPulsar={abrir}>{hayUbicacion ? 'Cambiar ubicación' : 'Agregar ubicación'}</BotonMorado>
        </div>
      )}

      {abierta && (
        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-pastel-lavanda p-4">
          <h3 className="text-lg">{hayUbicacion ? 'Cambiar ubicación' : 'Agregar ubicación'}</h3>
          <p className="text-sm text-suave">
            Abre esta pantalla <strong>estando dentro del kínder</strong> y pulsa el botón. El navegador te
            pedirá permiso de ubicación.
          </p>

          <div>
            <BotonSecundario alPulsar={() => void detectar()} deshabilitado={detectando}>
              {detectando ? 'Detectando…' : 'Usar mi ubicación actual'}
            </BotonSecundario>
          </div>

          {detectada && (
            <p role="status" className="rounded-xl bg-white px-4 py-3 text-sm">
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

          <div aria-live="polite">
            {error && (
              <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
                {error}
              </p>
            )}
          </div>

          <BotonPrincipal tipo="button" alPulsar={() => void guardar()} deshabilitado={actualizar.isPending}>
            {actualizar.isPending ? 'Guardando…' : 'Guardar ubicación'}
          </BotonPrincipal>
          <BotonSecundario alPulsar={cancelar} deshabilitado={actualizar.isPending}>
            Cancelar
          </BotonSecundario>
        </div>
      )}
    </Tarjeta>
  )
}
