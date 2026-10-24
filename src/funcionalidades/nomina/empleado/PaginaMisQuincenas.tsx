import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoColones } from '@/compartido/utilidades/formatoColones'
import { formatoDuracion } from '@/compartido/utilidades/formatoDuracion'
import { formatoFechaCalendario } from '@/compartido/utilidades/formatoFechas'
import { InsigniaPago } from '@/funcionalidades/nomina/componentes/InsigniaPago'
import { useMisQuincenas } from '@/funcionalidades/nomina/ganchos/useConsultasNomina'
import { etiquetaModalidad, textoTarifa } from '@/funcionalidades/nomina/tipos'

export function PaginaMisQuincenas() {
  const quincenas = useMisQuincenas()

  return (
    <section className="flex max-w-3xl flex-col gap-5">
      <h1 className="text-3xl">Mis quincenas</h1>

      <Tarjeta>
        <p className="mb-4 text-sm text-suave">
          Aquí ves el monto de cada quincena que la administradora ya calculó y si el pago ya se realizó.
        </p>
        {quincenas.isLoading && <p className="text-suave">Cargando…</p>}
        {quincenas.isError && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            No pudimos cargar tus quincenas.
          </p>
        )}
        {quincenas.data && quincenas.data.length === 0 && (
          <p className="rounded-2xl bg-pastel-lavanda px-4 py-6 text-center text-suave">
            Todavía no tienes quincenas guardadas.
          </p>
        )}
        {quincenas.data && quincenas.data.length > 0 && (
          <TablaAdaptable encabezados={['Quincena', 'Modalidad', 'Detalle', 'Monto', 'Estado']}>
            {quincenas.data.map((q) => (
              <FilaTabla key={q.id}>
                <CeldaTabla etiqueta="Quincena">
                  <span className="font-semibold">
                    {formatoFechaCalendario(q.fecha_inicio)} al {formatoFechaCalendario(q.fecha_fin)}
                  </span>
                </CeldaTabla>
                <CeldaTabla etiqueta="Modalidad">{etiquetaModalidad(q.modalidad_pago)}</CeldaTabla>
                <CeldaTabla etiqueta="Detalle">
                  {q.modalidad_pago === 'por_hora'
                    ? `${formatoDuracion(q.minutos_trabajados)} a ${textoTarifa(q.modalidad_pago, q.tarifa_crc)}`
                    : q.modalidad_pago === 'por_grupo'
                      ? `${q.cantidad_grupos} grupo(s) a ${textoTarifa(q.modalidad_pago, q.tarifa_crc)}`
                      : textoTarifa(q.modalidad_pago, q.tarifa_crc)}
                </CeldaTabla>
                <CeldaTabla etiqueta="Monto">
                  <strong>{formatoColones(q.monto_crc)}</strong>
                </CeldaTabla>
                <CeldaTabla etiqueta="Estado">
                  <span className="flex flex-col items-end gap-1 sm:items-start">
                    <InsigniaPago estado={q.estado} />
                    {q.pagada_en && (
                      <span className="text-xs text-suave">el {formatoFechaCalendario(q.pagada_en)}</span>
                    )}
                  </span>
                </CeldaTabla>
              </FilaTabla>
            ))}
          </TablaAdaptable>
        )}
      </Tarjeta>
    </section>
  )
}
