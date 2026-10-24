import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { DialogoConfirmacion } from '@/compartido/componentes/DialogoConfirmacion'
import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoColones } from '@/compartido/utilidades/formatoColones'
import { formatoDuracion } from '@/compartido/utilidades/formatoDuracion'
import { fechaHoyCR, formatoFechaCalendario } from '@/compartido/utilidades/formatoFechas'
import { InsigniaPago } from '@/funcionalidades/nomina/componentes/InsigniaPago'
import {
  useMarcarDetallePagado,
  useMarcarPeriodoPagado,
} from '@/funcionalidades/nomina/ganchos/useAccionesNomina'
import { useDetallePeriodo, usePeriodo } from '@/funcionalidades/nomina/ganchos/useConsultasNomina'
import { etiquetaModalidad, textoTarifa, type DetalleNomina } from '@/funcionalidades/nomina/tipos'

type Accion =
  | { tipo: 'uno'; detalle: DetalleNomina }
  | { tipo: 'todos' }
  | { tipo: 'revertir'; detalle: DetalleNomina }

export function PaginaDetalleQuincena() {
  const { id } = useParams<{ id: string }>()
  const periodo = usePeriodo(id)
  const detalle = useDetallePeriodo(id)
  const marcar = useMarcarDetallePagado()
  const marcarTodos = useMarcarPeriodoPagado()
  const [accion, setAccion] = useState<Accion | null>(null)
  const [fechaPago, setFechaPago] = useState(fechaHoyCR())
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)

  if (periodo.isLoading) return <p className="text-suave">Cargando…</p>

  if (periodo.isError || !periodo.data) {
    return (
      <section className="flex flex-col gap-4">
        <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
          No encontramos esta quincena.
        </p>
        <Link to="/administradora/nomina" className="font-semibold text-violeta">
          Volver a nómina
        </Link>
      </section>
    )
  }

  const p = periodo.data

  function pedir(nueva: Accion) {
    setFechaPago(fechaHoyCR())
    setAviso(null)
    setError(null)
    setAccion(nueva)
  }

  async function confirmar() {
    if (!accion) return
    const actual = accion
    setAccion(null)
    try {
      if (actual.tipo === 'todos') {
        const cantidad = await marcarTodos.mutateAsync({ periodoId: p.id, fecha: fechaPago })
        setAviso(`${cantidad} pago(s) marcado(s) como pagado(s).`)
      } else if (actual.tipo === 'uno') {
        await marcar.mutateAsync({ id: actual.detalle.id, pagada: true, fecha: fechaPago })
        setAviso(`Pago de ${actual.detalle.nombre_completo} marcado como pagado.`)
      } else {
        await marcar.mutateAsync({ id: actual.detalle.id, pagada: false, fecha: null })
        setAviso(`Pago de ${actual.detalle.nombre_completo} vuelto a pendiente.`)
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos actualizar el pago.')
    }
  }

  const ocupado = marcar.isPending || marcarTodos.isPending
  const necesitaFecha = accion?.tipo === 'uno' || accion?.tipo === 'todos'

  return (
    <section className="flex flex-col gap-5">
      <Link to="/administradora/nomina" className="text-sm font-semibold text-violeta">
        ← Volver a nómina
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl">Quincena guardada</h1>
          <p className="text-suave">
            {formatoFechaCalendario(p.fecha_inicio)} al {formatoFechaCalendario(p.fecha_fin)}
          </p>
        </div>
        {p.pendientes > 0 && (
          <BotonMorado alPulsar={() => pedir({ tipo: 'todos' })} deshabilitado={ocupado}>
            Marcar todas como pagadas
          </BotonMorado>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-2xl bg-pastel-lavanda p-4">
          <p className="text-sm text-suave">Total de la quincena</p>
          <p className="text-2xl font-semibold">{formatoColones(p.total_crc)}</p>
        </div>
        <div className="rounded-2xl bg-pastel-cielo p-4">
          <p className="text-sm text-suave">Empleados</p>
          <p className="text-2xl font-semibold">{p.empleados}</p>
        </div>
        <div className={`rounded-2xl p-4 ${p.pendientes === 0 ? 'bg-pastel-menta' : 'bg-pastel-mantequilla'}`}>
          <p className="text-sm text-suave">Pagos pendientes</p>
          <p className="text-2xl font-semibold">{p.pendientes}</p>
        </div>
      </div>

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

      <Tarjeta titulo="Detalle por empleado">
        <p className="mb-4 text-sm text-suave">
          Marcar un pago como realizado solo lo registra aquí: el sistema no hace transferencias ni genera
          comprobantes oficiales.
        </p>
        {detalle.isLoading && <p className="text-suave">Cargando…</p>}
        {detalle.isError && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            No pudimos cargar el detalle.
          </p>
        )}
        {detalle.data && (
          <TablaAdaptable
            encabezados={['Empleado', 'Modalidad', 'Tarifa', 'Horas', 'Grupos', 'Monto', 'Estado', 'Acción', 'Observaciones']}
          >
            {detalle.data.map((d) => (
              <FilaTabla key={d.id}>
                <CeldaTabla etiqueta="Empleado">{d.nombre_completo}</CeldaTabla>
                <CeldaTabla etiqueta="Modalidad">{etiquetaModalidad(d.modalidad_pago)}</CeldaTabla>
                <CeldaTabla etiqueta="Tarifa">{textoTarifa(d.modalidad_pago, d.tarifa_crc)}</CeldaTabla>
                <CeldaTabla etiqueta="Horas">
                  {d.modalidad_pago === 'por_hora' ? formatoDuracion(d.minutos_trabajados) : '—'}
                </CeldaTabla>
                <CeldaTabla etiqueta="Grupos">
                  {d.modalidad_pago === 'por_grupo' ? d.cantidad_grupos : '—'}
                </CeldaTabla>
                <CeldaTabla etiqueta="Monto">
                  <strong>{formatoColones(d.monto_crc)}</strong>
                </CeldaTabla>
                <CeldaTabla etiqueta="Estado">
                  <span className="flex flex-col items-end gap-1 sm:items-start">
                    <InsigniaPago estado={d.estado} />
                    {d.pagada_en && (
                      <span className="text-xs text-suave">el {formatoFechaCalendario(d.pagada_en)}</span>
                    )}
                  </span>
                </CeldaTabla>
                <CeldaTabla etiqueta="Acción">
                  {d.estado === 'pendiente' ? (
                    <BotonMorado alPulsar={() => pedir({ tipo: 'uno', detalle: d })} deshabilitado={ocupado}>
                      Marcar pagada
                    </BotonMorado>
                  ) : (
                    <BotonSecundario alPulsar={() => pedir({ tipo: 'revertir', detalle: d })} deshabilitado={ocupado}>
                      Volver a pendiente
                    </BotonSecundario>
                  )}
                </CeldaTabla>
                <CeldaTabla etiqueta="Observaciones">
                  {d.advertencias ? (
                    <span className="block rounded-xl bg-pastel-mantequilla px-3 py-2 text-left text-xs">
                      {d.advertencias}
                    </span>
                  ) : (
                    <span className="text-suave">—</span>
                  )}
                </CeldaTabla>
              </FilaTabla>
            ))}
          </TablaAdaptable>
        )}
      </Tarjeta>

      <DialogoConfirmacion
        abierto={accion !== null}
        titulo={
          accion?.tipo === 'todos'
            ? 'Marcar todas como pagadas'
            : accion?.tipo === 'uno'
              ? `Marcar pagada a ${accion.detalle.nombre_completo}`
              : accion?.tipo === 'revertir'
                ? `Volver a pendiente a ${accion.detalle.nombre_completo}`
                : ''
        }
        mensaje={
          necesitaFecha ? (
            <div className="flex flex-col gap-3 text-tinta">
              <p className="text-suave">
                {accion?.tipo === 'todos'
                  ? `Se marcarán como pagados los ${p.pendientes} pagos pendientes de esta quincena.`
                  : `Monto: ${accion?.tipo === 'uno' ? formatoColones(accion.detalle.monto_crc) : ''}.`}
              </p>
              <CampoTexto
                id="fecha-pago"
                etiqueta="Fecha en que se pagó"
                tipo="date"
                valor={fechaPago}
                alCambiar={setFechaPago}
              />
            </div>
          ) : (
            'El pago volverá a aparecer como pendiente. Queda registrado quién hizo el cambio.'
          )
        }
        textoConfirmar={accion?.tipo === 'revertir' ? 'Volver a pendiente' : 'Confirmar'}
        alConfirmar={() => void confirmar()}
        alCancelar={() => setAccion(null)}
        confirmarDeshabilitado={necesitaFecha && fechaPago === ''}
      />
    </section>
  )
}
