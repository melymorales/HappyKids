import { useState } from 'react'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { InsigniaEstado } from '@/compartido/componentes/InsigniaEstado'
import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import {
  useAgregarRed,
  useCambiarEstadoRed,
  useDetectarRed,
} from '@/funcionalidades/asistencia/ganchos/useAccionesAsistencia'
import { useRedes } from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'

export function SeccionRedesPermitidas() {
  const redes = useRedes()
  const detectar = useDetectarRed()
  const agregar = useAgregarRed()
  const cambiarEstado = useCambiarEstadoRed()
  const [abierta, setAbierta] = useState(false)
  const [etiqueta, setEtiqueta] = useState('')
  const [red, setRed] = useState('')
  const [mensajeDeteccion, setMensajeDeteccion] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  function limpiar() {
    setEtiqueta('')
    setRed('')
    setMensajeDeteccion(null)
    setError(null)
  }

  function abrir() {
    limpiar()
    setAviso(null)
    setAbierta(true)
  }

  function cancelar() {
    limpiar()
    setAbierta(false)
  }

  async function detectarRed() {
    setError(null)
    setMensajeDeteccion(null)
    try {
      const resultado = await detectar.mutateAsync()
      if (!resultado.ok) {
        setMensajeDeteccion(resultado.mensaje)
        return
      }
      setRed(resultado.red)
      setMensajeDeteccion(
        `Tu dirección actual es ${resultado.ip} (IPv${resultado.version}). Se propone registrar la red ${resultado.red}.`,
      )
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos detectar tu red.')
    }
  }

  async function guardarRed() {
    if (etiqueta.trim() === '' || red.trim() === '') {
      setError('Escribe un nombre y la red (usa el botón "Detectar mi red").')
      return
    }
    setError(null)
    try {
      await agregar.mutateAsync({ etiqueta: etiqueta.trim(), red: red.trim() })
      limpiar()
      setAbierta(false)
      setAviso('Red guardada.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar la red.')
    }
  }

  return (
    <Tarjeta titulo="Redes desde las que se puede marcar">
      <p className="mb-4 text-sm text-suave">
        Las empleadas solo pueden marcar conectadas a una de estas redes. Para registrar la del kínder, abre
        esta pantalla <strong>conectada al Wi-Fi del kínder</strong>.
      </p>

      {redes.isLoading && <p className="text-suave">Cargando…</p>}
      {redes.isError && (
        <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
          No pudimos cargar las redes.
        </p>
      )}
      {redes.data && redes.data.length === 0 && (
        <p className="rounded-xl bg-pastel-mantequilla px-4 py-3 text-sm">
          Todavía no hay redes registradas, así que nadie puede marcar asistencia.
        </p>
      )}
      {redes.data && redes.data.length > 0 && (
        <TablaAdaptable encabezados={['Nombre', 'Red', 'Estado', 'Acción']}>
          {redes.data.map((r) => (
            <FilaTabla key={r.id}>
              <CeldaTabla etiqueta="Nombre">{r.etiqueta}</CeldaTabla>
              <CeldaTabla etiqueta="Red">
                <span className="break-all">{r.red}</span>
              </CeldaTabla>
              <CeldaTabla etiqueta="Estado">
                <InsigniaEstado activo={r.activa} />
              </CeldaTabla>
              <CeldaTabla etiqueta="Acción">
                <BotonSecundario
                  deshabilitado={cambiarEstado.isPending}
                  alPulsar={() => void cambiarEstado.mutateAsync({ id: r.id, activa: !r.activa })}
                >
                  {r.activa ? 'Desactivar' : 'Activar'}
                </BotonSecundario>
              </CeldaTabla>
            </FilaTabla>
          ))}
        </TablaAdaptable>
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
          <BotonMorado alPulsar={abrir}>Agregar red</BotonMorado>
        </div>
      )}

      {abierta && (
        <div className="mt-4 flex flex-col gap-4 rounded-2xl bg-pastel-lavanda p-4">
          <h3 className="text-lg">Agregar una red</h3>
          <p className="text-sm text-suave">
            Si el internet usa más de un tipo de dirección (IPv4 e IPv6), repite el proceso desde otro
            dispositivo.
          </p>
          <div>
            <BotonSecundario alPulsar={() => void detectarRed()} deshabilitado={detectar.isPending}>
              {detectar.isPending ? 'Detectando…' : 'Detectar mi red'}
            </BotonSecundario>
          </div>
          {mensajeDeteccion && (
            <p role="status" className="rounded-xl bg-white px-4 py-3 text-sm">
              {mensajeDeteccion}
            </p>
          )}
          <CampoTexto
            id="etiqueta-red"
            etiqueta="Nombre de la red"
            valor={etiqueta}
            alCambiar={setEtiqueta}
            placeholder="Wi-Fi del kínder"
            autoComplete="off"
          />
          <CampoTexto
            id="red"
            etiqueta="Red (IP)"
            valor={red}
            alCambiar={setRed}
            placeholder="190.10.20.30"
            autoComplete="off"
            ayuda="Se llena sola con el botón de detección. También puedes escribir una IP fija que te dé el proveedor."
          />

          <div aria-live="polite">
            {error && (
              <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
                {error}
              </p>
            )}
          </div>

          <BotonPrincipal tipo="button" alPulsar={() => void guardarRed()} deshabilitado={agregar.isPending}>
            {agregar.isPending ? 'Guardando…' : 'Guardar red'}
          </BotonPrincipal>
          <BotonSecundario alPulsar={cancelar} deshabilitado={agregar.isPending}>
            Cancelar
          </BotonSecundario>
        </div>
      )}
    </Tarjeta>
  )
}
