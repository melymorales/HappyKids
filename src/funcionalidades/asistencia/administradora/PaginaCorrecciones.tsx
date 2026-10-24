import { useState } from 'react'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { DialogoConNota } from '@/compartido/componentes/DialogoConNota'
import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoFechaHora } from '@/compartido/utilidades/formatoFechas'
import { FormularioCorreccion } from '@/funcionalidades/asistencia/componentes/FormularioCorreccion'
import { InsigniaSolicitud } from '@/funcionalidades/asistencia/componentes/InsigniaSolicitud'
import { NavegacionAsistencia } from '@/funcionalidades/asistencia/componentes/NavegacionAsistencia'
import { useResolverCorreccion } from '@/funcionalidades/asistencia/ganchos/useAccionesAsistencia'
import { useCorrecciones, usePersonal } from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'
import { describirCorreccion } from '@/funcionalidades/asistencia/textoCorreccion'
import type { Correccion } from '@/funcionalidades/asistencia/tipos'

interface Decision {
  correccion: Correccion
  aprobar: boolean
}

export function PaginaCorrecciones() {
  const pendientes = useCorrecciones('pendientes')
  const resueltas = useCorrecciones('resueltas')
  const personal = usePersonal()
  const resolver = useResolverCorreccion()
  const [decision, setDecision] = useState<Decision | null>(null)
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function aplicarDecision(comentario: string) {
    if (!decision) return
    const actual = decision
    setDecision(null)
    setError(null)
    setAviso(null)
    try {
      await resolver.mutateAsync({ id: actual.correccion.id, aprobar: actual.aprobar, comentario })
      setAviso(actual.aprobar ? 'Corrección aprobada.' : 'Corrección rechazada.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos resolver la corrección.')
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl">Asistencia</h1>
      <NavegacionAsistencia />

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

      <Tarjeta titulo="Pendientes">
        {pendientes.isLoading && <p className="text-suave">Cargando…</p>}
        {pendientes.isError && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            No pudimos cargar las correcciones.
          </p>
        )}
        {pendientes.data && pendientes.data.length === 0 && (
          <p className="rounded-2xl bg-pastel-menta px-4 py-4 text-center">No hay correcciones pendientes.</p>
        )}
        {pendientes.data && pendientes.data.length > 0 && (
          <TablaAdaptable encabezados={['Empleado', 'Solicitud', 'Motivo', 'Pedida', 'Acciones']}>
            {pendientes.data.map((c) => (
              <FilaTabla key={c.id}>
                <CeldaTabla etiqueta="Empleado">{c.nombre_completo ?? '—'}</CeldaTabla>
                <CeldaTabla etiqueta="Solicitud">{describirCorreccion(c)}</CeldaTabla>
                <CeldaTabla etiqueta="Motivo">{c.motivo}</CeldaTabla>
                <CeldaTabla etiqueta="Pedida">{formatoFechaHora(c.solicitada_en)}</CeldaTabla>
                <CeldaTabla etiqueta="Acciones">
                  <span className="flex flex-wrap justify-end gap-2 sm:justify-start">
                    <BotonMorado
                      alPulsar={() => setDecision({ correccion: c, aprobar: true })}
                      deshabilitado={resolver.isPending}
                    >
                      Aprobar
                    </BotonMorado>
                    <BotonSecundario
                      alPulsar={() => setDecision({ correccion: c, aprobar: false })}
                      deshabilitado={resolver.isPending}
                    >
                      Rechazar
                    </BotonSecundario>
                  </span>
                </CeldaTabla>
              </FilaTabla>
            ))}
          </TablaAdaptable>
        )}
      </Tarjeta>

      <Tarjeta titulo="Registrar una marca olvidada">
        <p className="text-sm text-suave">
          Si una empleada olvidó marcar y te lo dijo directamente, puedes registrar la marca tú. Queda aprobada de
          una vez, con tu nombre y el motivo.
        </p>
        {!formularioAbierto && (
          <div className="mt-4">
            <BotonMorado
              alPulsar={() => {
                setAviso(null)
                setFormularioAbierto(true)
              }}
            >
              Registrar marca
            </BotonMorado>
          </div>
        )}
        {formularioAbierto && (
          <div className="mt-4">
            <FormularioCorreccion
              personal={personal.data ?? []}
              alCancelar={() => setFormularioAbierto(false)}
              alGuardar={() => {
                setFormularioAbierto(false)
                setAviso('Marca registrada y aprobada.')
              }}
            />
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Historial">
        {resueltas.isLoading && <p className="text-suave">Cargando…</p>}
        {resueltas.data && resueltas.data.length === 0 && (
          <p className="text-suave">Todavía no hay correcciones resueltas.</p>
        )}
        {resueltas.data && resueltas.data.length > 0 && (
          <TablaAdaptable encabezados={['Empleado', 'Solicitud', 'Estado', 'Resuelta por', 'Nota']}>
            {resueltas.data.map((c) => (
              <FilaTabla key={c.id}>
                <CeldaTabla etiqueta="Empleado">{c.nombre_completo ?? '—'}</CeldaTabla>
                <CeldaTabla etiqueta="Solicitud">{describirCorreccion(c)}</CeldaTabla>
                <CeldaTabla etiqueta="Estado">
                  <InsigniaSolicitud estado={c.estado} />
                </CeldaTabla>
                <CeldaTabla etiqueta="Resuelta por">
                  {c.resolutor ?? '—'}
                  {c.resuelta_en && <span className="ml-1 text-suave">({formatoFechaHora(c.resuelta_en)})</span>}
                </CeldaTabla>
                <CeldaTabla etiqueta="Nota">{c.nota_resolucion ?? c.motivo}</CeldaTabla>
              </FilaTabla>
            ))}
          </TablaAdaptable>
        )}
      </Tarjeta>

      <DialogoConNota
        abierto={decision !== null}
        titulo={decision?.aprobar ? 'Aprobar corrección' : 'Rechazar corrección'}
        descripcion={
          decision
            ? `${decision.correccion.nombre_completo ?? 'Empleado'}: ${describirCorreccion(decision.correccion)}. Motivo: ${decision.correccion.motivo}`
            : ''
        }
        etiquetaNota={decision?.aprobar ? 'Comentario (opcional)' : 'Motivo del rechazo (obligatorio)'}
        notaObligatoria={decision?.aprobar === false}
        longitudMinima={3}
        textoConfirmar={decision?.aprobar ? 'Aprobar' : 'Rechazar'}
        alConfirmar={(nota) => void aplicarDecision(nota)}
        alCancelar={() => setDecision(null)}
        procesando={resolver.isPending}
      />
    </section>
  )
}
