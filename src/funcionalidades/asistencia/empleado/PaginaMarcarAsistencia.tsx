import { useState } from 'react'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { fechaHoyCR, formatoFechaHora, formatoHora, sumarDias } from '@/compartido/utilidades/formatoFechas'
import { mensajeUbicacion, obtenerUbicacion } from '@/compartido/utilidades/geolocalizacion'
import { TablaJornadas } from '@/funcionalidades/asistencia/componentes/TablaJornadas'
import { useRegistrarMarca } from '@/funcionalidades/asistencia/ganchos/useAccionesAsistencia'
import { useJornadas, useMisMarcas } from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'
import {
  HORAS_MAXIMAS_JORNADA,
  type PosicionMarca,
  type TipoMarca,
} from '@/funcionalidades/asistencia/tipos'

interface Resultado {
  exito: boolean
  mensaje: string
  aviso?: string
}

export function PaginaMarcarAsistencia() {
  const marcas = useMisMarcas()
  const registrar = useRegistrarMarca()
  const hoy = fechaHoyCR()
  const jornadas = useJornadas(sumarDias(hoy, -13), hoy, null)
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)

  const ultima = marcas.data?.[0]
  const entradaAbierta =
    ultima?.tipo === 'entrada' &&
    Date.now() - new Date(ultima.marcada_en).getTime() < HORAS_MAXIMAS_JORNADA * 3_600_000
  const siguiente: TipoMarca = entradaAbierta ? 'salida' : 'entrada'
  const ocupada = obteniendoUbicacion || registrar.isPending

  async function marcar() {
    setResultado(null)
    setObteniendoUbicacion(true)
    const ubicacion = await obtenerUbicacion()
    setObteniendoUbicacion(false)

    const posicion: PosicionMarca | null = ubicacion.ok
      ? { lat: ubicacion.lat, lng: ubicacion.lng, precision_m: ubicacion.precision_m }
      : null

    try {
      const respuesta = await registrar.mutateAsync({ tipo: siguiente, posicion })
      if (!respuesta.ok) {
        setResultado({ exito: false, mensaje: respuesta.mensaje })
        return
      }
      let aviso: string | undefined
      if (respuesta.bandera === 'sin_ubicacion') {
        aviso = ubicacion.ok
          ? 'Tu marca se guardó sin ubicación.'
          : `${mensajeUbicacion(ubicacion.motivo)} La marca se guardó, pero la administradora podría revisarla.`
      } else if (respuesta.bandera === 'fuera_de_radio') {
        aviso = 'Tu marca se guardó, pero tu ubicación no coincide con el kínder. La administradora podría revisarla.'
      }
      setResultado({
        exito: true,
        mensaje: `${respuesta.tipo === 'entrada' ? 'Entrada' : 'Salida'} registrada a las ${formatoHora(respuesta.marcada_en)}.`,
        aviso,
      })
    } catch (e) {
      setResultado({ exito: false, mensaje: e instanceof Error ? e.message : 'No pudimos registrar tu marca.' })
    }
  }

  return (
    <section className="flex max-w-xl flex-col gap-5">
      <h1 className="text-3xl">Asistencia</h1>

      <Tarjeta>
        <p className="text-suave">
          {marcas.isLoading
            ? 'Cargando…'
            : ultima
              ? `Tu última marca: ${ultima.tipo === 'entrada' ? 'entrada' : 'salida'} el ${formatoFechaHora(ultima.marcada_en)}.`
              : 'Todavía no tienes marcas.'}
        </p>

        <div className="mt-4">
          <BotonPrincipal tipo="button" alPulsar={() => void marcar()} deshabilitado={ocupada || marcas.isLoading}>
            {obteniendoUbicacion
              ? 'Obteniendo ubicación…'
              : registrar.isPending
                ? 'Registrando…'
                : siguiente === 'entrada'
                  ? 'Marcar entrada'
                  : 'Marcar salida'}
          </BotonPrincipal>
        </div>

        <div aria-live="polite" className="mt-4 flex flex-col gap-3">
          {resultado && (
            <p
              role={resultado.exito ? 'status' : 'alert'}
              className={`rounded-xl px-4 py-3 text-sm ${resultado.exito ? 'bg-pastel-menta' : 'bg-pastel-rosa'}`}
            >
              {resultado.mensaje}
            </p>
          )}
          {resultado?.aviso && (
            <p role="status" className="rounded-xl bg-pastel-mantequilla px-4 py-3 text-sm">
              {resultado.aviso}
            </p>
          )}
        </div>

        <p className="mt-4 text-sm text-suave">
          Debes estar conectada al Wi-Fi del kínder. Al marcar, el sistema guarda la hora, tu ubicación
          aproximada y la red desde la que marcas.
        </p>
      </Tarjeta>

      <Tarjeta titulo="Mis horas (últimos 14 días)">
        {jornadas.isLoading && <p className="text-suave">Cargando…</p>}
        {jornadas.isError && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            No pudimos cargar tus horas.
          </p>
        )}
        {jornadas.data && <TablaJornadas jornadas={jornadas.data} />}
      </Tarjeta>

      <Tarjeta titulo="Mis últimas marcas">
        {marcas.isError && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            No pudimos cargar tus marcas.
          </p>
        )}
        {marcas.data && marcas.data.length === 0 && <p className="text-suave">Todavía no hay marcas.</p>}
        {marcas.data && marcas.data.length > 0 && (
          <ul className="flex flex-col divide-y divide-pastel-lavanda">
            {marcas.data.map((m) => (
              <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span className="font-semibold">{m.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span>
                <span>{formatoFechaHora(m.marcada_en)}</span>
              </li>
            ))}
          </ul>
        )}
      </Tarjeta>
    </section>
  )
}
