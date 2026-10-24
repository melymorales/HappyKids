import { useState } from 'react'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { DialogoConNota } from '@/compartido/componentes/DialogoConNota'
import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoFechaHora } from '@/compartido/utilidades/formatoFechas'
import { InsigniaUbicacion } from '@/funcionalidades/asistencia/componentes/InsigniaUbicacion'
import { NavegacionAsistencia } from '@/funcionalidades/asistencia/componentes/NavegacionAsistencia'
import { useRevisarMarca } from '@/funcionalidades/asistencia/ganchos/useAccionesAsistencia'
import {
  useHistorialRevisiones,
  useMarcasPorRevisar,
} from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'
import type { MarcaDetalle } from '@/funcionalidades/asistencia/tipos'

export function PaginaRevisionMarcas() {
  const marcas = useMarcasPorRevisar()
  const historial = useHistorialRevisiones()
  const revisar = useRevisarMarca()
  const [marcaAAnular, setMarcaAAnular] = useState<MarcaDetalle | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  async function aceptar(marca: MarcaDetalle) {
    setError(null)
    setAviso(null)
    try {
      await revisar.mutateAsync({ marcaId: marca.id, aceptar: true, nota: '' })
      setAviso('Marca aceptada.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar la revisión.')
    }
  }

  async function anular(nota: string) {
    if (!marcaAAnular) return
    const marca = marcaAAnular
    setMarcaAAnular(null)
    setError(null)
    setAviso(null)
    try {
      await revisar.mutateAsync({ marcaId: marca.id, aceptar: false, nota })
      setAviso('Marca anulada.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos anular la marca.')
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl">Asistencia</h1>
      <NavegacionAsistencia />

      <Tarjeta titulo="Marcas por revisar">
        <p className="mb-4 text-sm text-suave">
          Son marcas que se guardaron, pero con la ubicación fuera del radio o sin ubicación. Acepta las que son
          normales. Anula las que no corresponden: la marca original se conserva, pero deja de contar.
        </p>

        <div aria-live="polite" className="mb-3 flex flex-col gap-3">
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

        {marcas.isLoading && <p className="text-suave">Cargando…</p>}
        {marcas.isError && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            No pudimos cargar las marcas.
          </p>
        )}
        {marcas.data && marcas.data.length === 0 && (
          <p className="rounded-2xl bg-pastel-menta px-4 py-4 text-center">No hay marcas por revisar.</p>
        )}
        {marcas.data && marcas.data.length > 0 && (
          <TablaAdaptable
            encabezados={['Fecha y hora', 'Empleado', 'Tipo', 'Ubicación', 'Distancia', 'Precisión', 'Acciones']}
          >
            {marcas.data.map((m) => (
              <FilaTabla key={m.id}>
                <CeldaTabla etiqueta="Fecha y hora">{formatoFechaHora(m.marcada_en)}</CeldaTabla>
                <CeldaTabla etiqueta="Empleado">{m.nombre_completo}</CeldaTabla>
                <CeldaTabla etiqueta="Tipo">{m.tipo === 'entrada' ? 'Entrada' : 'Salida'}</CeldaTabla>
                <CeldaTabla etiqueta="Ubicación">
                  <InsigniaUbicacion bandera={m.bandera_ubicacion} />
                </CeldaTabla>
                <CeldaTabla etiqueta="Distancia">{m.distancia_m === null ? '—' : `${m.distancia_m} m`}</CeldaTabla>
                <CeldaTabla etiqueta="Precisión">
                  {m.precision_m === null ? '—' : `±${Math.round(m.precision_m)} m`}
                </CeldaTabla>
                <CeldaTabla etiqueta="Acciones">
                  <span className="flex flex-wrap justify-end gap-2 sm:justify-start">
                    <BotonMorado alPulsar={() => void aceptar(m)} deshabilitado={revisar.isPending}>
                      Aceptar
                    </BotonMorado>
                    <BotonSecundario alPulsar={() => setMarcaAAnular(m)} deshabilitado={revisar.isPending}>
                      Anular
                    </BotonSecundario>
                  </span>
                </CeldaTabla>
              </FilaTabla>
            ))}
          </TablaAdaptable>
        )}
      </Tarjeta>

      <Tarjeta titulo="Historial">
        <p className="mb-4 text-sm text-suave">
          Marcas señaladas que ya se revisaron, de la más reciente a la más antigua (hasta 100).
        </p>
        {historial.isLoading && <p className="text-suave">Cargando…</p>}
        {historial.isError && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            No pudimos cargar el historial.
          </p>
        )}
        {historial.data && historial.data.length === 0 && (
          <p className="text-suave">Todavía no hay marcas revisadas.</p>
        )}
        {historial.data && historial.data.length > 0 && (
          <TablaAdaptable
            encabezados={['Marca', 'Empleado', 'Tipo', 'Ubicación', 'Decisión', 'Revisada por', 'Nota']}
          >
            {historial.data.map((h) => (
              <FilaTabla key={h.id}>
                <CeldaTabla etiqueta="Marca">{formatoFechaHora(h.marcada_en)}</CeldaTabla>
                <CeldaTabla etiqueta="Empleado">{h.nombre_completo}</CeldaTabla>
                <CeldaTabla etiqueta="Tipo">{h.tipo === 'entrada' ? 'Entrada' : 'Salida'}</CeldaTabla>
                <CeldaTabla etiqueta="Ubicación">
                  <InsigniaUbicacion bandera={h.bandera_ubicacion} />
                </CeldaTabla>
                <CeldaTabla etiqueta="Decisión">
                  {h.estado === 'revisada_ok' ? (
                    <span className="inline-block rounded-full bg-pastel-menta px-3 py-0.5 text-sm font-semibold">
                      Aceptada
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-pastel-rosa px-3 py-0.5 text-sm font-semibold">
                      Anulada
                    </span>
                  )}
                </CeldaTabla>
                <CeldaTabla etiqueta="Revisada por">
                  {h.revisor ?? '—'}
                  <span className="ml-1 text-suave">({formatoFechaHora(h.revisada_en)})</span>
                </CeldaTabla>
                <CeldaTabla etiqueta="Nota">{h.nota ?? '—'}</CeldaTabla>
              </FilaTabla>
            ))}
          </TablaAdaptable>
        )}
      </Tarjeta>

      <DialogoConNota
        abierto={marcaAAnular !== null}
        titulo="Anular marca"
        descripcion={
          marcaAAnular
            ? `Se anulará la ${marcaAAnular.tipo === 'entrada' ? 'entrada' : 'salida'} de ${marcaAAnular.nombre_completo} del ${formatoFechaHora(marcaAAnular.marcada_en)}.`
            : ''
        }
        etiquetaNota="Motivo (obligatorio)"
        notaObligatoria
        longitudMinima={5}
        textoConfirmar="Anular marca"
        alConfirmar={(nota) => void anular(nota)}
        alCancelar={() => setMarcaAAnular(null)}
        procesando={revisar.isPending}
      />
    </section>
  )
}
