import { useMemo, useState } from 'react'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { DialogoConNota } from '@/compartido/componentes/DialogoConNota'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { fechaHoyCR, formatoFechaHora, formatoHora, sumarDias } from '@/compartido/utilidades/formatoFechas'
import { mensajeUbicacion, obtenerUbicacion } from '@/compartido/utilidades/geolocalizacion'
import { FormularioCorreccion } from '@/funcionalidades/asistencia/componentes/FormularioCorreccion'
import { InsigniaSolicitud } from '@/funcionalidades/asistencia/componentes/InsigniaSolicitud'
import { TablaJornadas } from '@/funcionalidades/asistencia/componentes/TablaJornadas'
import {
  useRegistrarMarca,
  useSolicitarCorreccion,
} from '@/funcionalidades/asistencia/ganchos/useAccionesAsistencia'
import {
  useJornadas,
  useMisCorrecciones,
  useMisMarcas,
} from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'
import { describirCorreccion } from '@/funcionalidades/asistencia/textoCorreccion'
import {
  HORAS_MAXIMAS_JORNADA,
  type EstadoSolicitud,
  type Marca,
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
  const correcciones = useMisCorrecciones()
  const registrar = useRegistrarMarca()
  const solicitar = useSolicitarCorreccion()
  const hoy = fechaHoyCR()
  const jornadas = useJornadas(sumarDias(hoy, -13), hoy, null)
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false)
  const [resultado, setResultado] = useState<Resultado | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [avisoSolicitud, setAvisoSolicitud] = useState<string | null>(null)
  const [errorSolicitud, setErrorSolicitud] = useState<string | null>(null)
  const [marcaAAnular, setMarcaAAnular] = useState<Marca | null>(null)

  // Estado de la última solicitud de anulación de cada marca (la lista viene de la más reciente a la más antigua).
  const estadoAnulacion = useMemo(() => {
    const mapa = new Map<string, EstadoSolicitud>()
    for (const c of correcciones.data ?? []) {
      if (c.tipo === 'anular' && c.marca_objetivo_id && !mapa.has(c.marca_objetivo_id)) {
        mapa.set(c.marca_objetivo_id, c.estado)
      }
    }
    return mapa
  }, [correcciones.data])

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

  async function pedirAnulacion(nota: string) {
    if (!marcaAAnular) return
    const marca = marcaAAnular
    setMarcaAAnular(null)
    setErrorSolicitud(null)
    setAvisoSolicitud(null)
    try {
      await solicitar.mutateAsync({ tipo: 'anular', motivo: nota, marcaObjetivoId: marca.id })
      setAvisoSolicitud('Solicitud enviada. La administradora la revisará.')
    } catch (e) {
      setErrorSolicitud(e instanceof Error ? e.message : 'No pudimos enviar la solicitud.')
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

      <Tarjeta titulo="¿Olvidaste marcar?">
        <p className="text-sm text-suave">
          Si no pudiste marcar una entrada o una salida, pide una corrección. Cuenta en tus horas cuando la
          administradora la apruebe.
        </p>

        <div aria-live="polite" className="mt-3 flex flex-col gap-3">
          {avisoSolicitud && (
            <p role="status" className="rounded-xl bg-pastel-menta px-4 py-3 text-sm">
              {avisoSolicitud}
            </p>
          )}
          {errorSolicitud && (
            <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
              {errorSolicitud}
            </p>
          )}
        </div>

        {!formularioAbierto && (
          <div className="mt-4">
            <BotonMorado
              alPulsar={() => {
                setAvisoSolicitud(null)
                setErrorSolicitud(null)
                setFormularioAbierto(true)
              }}
            >
              Pedir corrección
            </BotonMorado>
          </div>
        )}
        {formularioAbierto && (
          <div className="mt-4">
            <FormularioCorreccion
              alCancelar={() => setFormularioAbierto(false)}
              alGuardar={() => {
                setFormularioAbierto(false)
                setAvisoSolicitud('Solicitud enviada. La administradora la revisará.')
              }}
            />
          </div>
        )}
      </Tarjeta>

      {correcciones.data && correcciones.data.length > 0 && (
        <Tarjeta titulo="Mis solicitudes">
          <ul className="flex flex-col divide-y divide-pastel-lavanda">
            {correcciones.data.map((c) => (
              <li key={c.id} className="flex flex-col gap-1 py-3 text-sm">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="font-semibold">{describirCorreccion(c)}</span>
                  <InsigniaSolicitud estado={c.estado} />
                </div>
                <span className="text-suave">Motivo: {c.motivo}</span>
                {c.nota_resolucion && <span className="text-suave">Respuesta: {c.nota_resolucion}</span>}
              </li>
            ))}
          </ul>
        </Tarjeta>
      )}

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
          <ul className="flex flex-col gap-1">
            {marcas.data.map((m) => {
              const anulacion = estadoAnulacion.get(m.id)
              const enCorreccion = anulacion === 'pendiente'
              return (
                <li
                  key={m.id}
                  className={`flex flex-wrap items-center justify-between gap-2 rounded-xl px-3 py-2 text-sm ${
                    enCorreccion ? 'bg-pastel-mantequilla' : ''
                  }`}
                >
                  <span className="flex flex-wrap items-center gap-2">
                    <span className="font-semibold">{m.tipo === 'entrada' ? 'Entrada' : 'Salida'}</span>
                    {m.origen === 'correccion' && (
                      <span className="rounded-full bg-pastel-cielo px-2 py-0.5 text-xs font-semibold">
                        Corrección
                      </span>
                    )}
                    {enCorreccion && (
                      <span className="rounded-full bg-white px-2 py-0.5 text-xs font-semibold">
                        En corrección
                      </span>
                    )}
                    {anulacion === 'rechazada' && (
                      <span className="rounded-full bg-pastel-rosa px-2 py-0.5 text-xs font-semibold">
                        Anulación rechazada
                      </span>
                    )}
                  </span>
                  <span>{formatoFechaHora(m.marcada_en)}</span>
                  {enCorreccion && (
                    <span className="w-full text-xs text-suave">
                      Pediste anular esta marca. Estamos esperando la respuesta de la administradora.
                    </span>
                  )}
                  {m.origen === 'marca' && !enCorreccion && (
                    <BotonSecundario alPulsar={() => setMarcaAAnular(m)}>Marqué por error</BotonSecundario>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </Tarjeta>

      <DialogoConNota
        abierto={marcaAAnular !== null}
        titulo="¿Marcaste por error?"
        descripcion={
          marcaAAnular
            ? `Pedirás anular tu ${marcaAAnular.tipo === 'entrada' ? 'entrada' : 'salida'} del ${formatoFechaHora(marcaAAnular.marcada_en)}. La administradora debe aprobarlo.`
            : ''
        }
        etiquetaNota="Motivo"
        notaObligatoria
        longitudMinima={5}
        textoConfirmar="Enviar solicitud"
        alConfirmar={(nota) => void pedirAnulacion(nota)}
        alCancelar={() => setMarcaAAnular(null)}
        procesando={solicitar.isPending}
      />
    </section>
  )
}
