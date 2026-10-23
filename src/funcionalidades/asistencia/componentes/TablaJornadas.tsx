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

  return (
    <div className="overflow-x-auto rounded-3xl border-2 border-pastel-lavanda bg-white">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b-2 border-pastel-lavanda text-suave">
            <th className="px-4 py-3 font-semibold">Fecha</th>
            {nombres && <th className="px-4 py-3 font-semibold">Empleado</th>}
            <th className="px-4 py-3 font-semibold">Horas</th>
            <th className="px-4 py-3 font-semibold">Estado</th>
          </tr>
        </thead>
        <tbody>
          {ordenadas.map((j) => {
            const enCurso = j.incompleta && j.fecha === hoy
            return (
              <tr key={`${j.empleado_id}-${j.fecha}`} className="border-b border-pastel-lavanda last:border-b-0">
                <td className="px-4 py-3">{formatoFechaCalendario(j.fecha)}</td>
                {nombres && <td className="px-4 py-3">{nombres.get(j.empleado_id) ?? '—'}</td>}
                <td className="px-4 py-3">{formatoDuracion(j.minutos)}</td>
                <td className="px-4 py-3">
                  {!j.incompleta ? (
                    <span className="inline-block rounded-full bg-pastel-menta px-3 py-0.5 font-semibold">Completa</span>
                  ) : enCurso ? (
                    <span className="inline-block rounded-full bg-pastel-cielo px-3 py-0.5 font-semibold">En curso</span>
                  ) : (
                    <span className="inline-block rounded-full bg-pastel-rosa px-3 py-0.5 font-semibold">Incompleta</span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
