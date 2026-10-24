import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { formatoDuracion } from '@/compartido/utilidades/formatoDuracion'
import { fechaHoyCR, formatoFechaCalendario } from '@/compartido/utilidades/formatoFechas'
import type { Jornada } from '@/funcionalidades/asistencia/tipos'

interface Props {
  jornadas: Jornada[]
  /** Si se indica, se muestra la columna "Empleado". */
  nombres?: Map<string, string>
}

export function TablaJornadas({ jornadas, nombres }: Props) {
  const hoy = fechaHoyCR()
  const ordenadas = [...jornadas].sort((a, b) => {
    if (a.fecha !== b.fecha) return a.fecha < b.fecha ? 1 : -1
    return (nombres?.get(a.empleado_id) ?? '').localeCompare(nombres?.get(b.empleado_id) ?? '')
  })

  if (ordenadas.length === 0) {
    return (
      <p className="rounded-2xl bg-pastel-lavanda px-4 py-6 text-center text-suave">
        No hay jornadas en estas fechas.
      </p>
    )
  }

  const encabezados = nombres ? ['Fecha', 'Empleado', 'Horas', 'Estado'] : ['Fecha', 'Horas', 'Estado']

  return (
    <TablaAdaptable encabezados={encabezados}>
      {ordenadas.map((j) => {
        const enCurso = j.incompleta && j.fecha === hoy
        return (
          <FilaTabla key={`${j.empleado_id}-${j.fecha}`}>
            <CeldaTabla etiqueta="Fecha">{formatoFechaCalendario(j.fecha)}</CeldaTabla>
            {nombres && <CeldaTabla etiqueta="Empleado">{nombres.get(j.empleado_id) ?? '—'}</CeldaTabla>}
            <CeldaTabla etiqueta="Horas">{formatoDuracion(j.minutos)}</CeldaTabla>
            <CeldaTabla etiqueta="Estado">
              {!j.incompleta ? (
                <span className="inline-block rounded-full bg-pastel-menta px-3 py-0.5 font-semibold">Completa</span>
              ) : enCurso ? (
                <span className="inline-block rounded-full bg-pastel-cielo px-3 py-0.5 font-semibold">En curso</span>
              ) : (
                <span className="inline-block rounded-full bg-pastel-rosa px-3 py-0.5 font-semibold">Incompleta</span>
              )}
            </CeldaTabla>
          </FilaTabla>
        )
      })}
    </TablaAdaptable>
  )
}
