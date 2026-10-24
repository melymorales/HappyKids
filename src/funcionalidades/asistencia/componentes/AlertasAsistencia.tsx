import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { formatoFechaCalendario } from '@/compartido/utilidades/formatoFechas'
import type { AlertaAsistencia, CodigoAlerta } from '@/funcionalidades/asistencia/tipos'

const ETIQUETAS: Record<CodigoAlerta, string> = {
  jornada_incompleta: 'Jornada incompleta',
  jornada_larga: 'Jornada muy larga',
  fuera_de_horario: 'Marca fuera de horario',
  horas_identicas: 'Horas idénticas',
}

interface Props {
  alertas: AlertaAsistencia[]
  nombres: Map<string, string>
}

export function AlertasAsistencia({ alertas, nombres }: Props) {
  if (alertas.length === 0) {
    return <p className="rounded-2xl bg-pastel-menta px-4 py-4 text-center">No hay alertas en estas fechas.</p>
  }

  const ordenadas = [...alertas].sort((a, b) => (a.fecha < b.fecha ? 1 : a.fecha > b.fecha ? -1 : 0))

  return (
    <TablaAdaptable encabezados={['Fecha', 'Empleado', 'Alerta', 'Detalle']}>
      {ordenadas.map((a, indice) => (
        <FilaTabla key={`${a.empleado_id}-${a.fecha}-${a.codigo}-${indice}`}>
          <CeldaTabla etiqueta="Fecha">{formatoFechaCalendario(a.fecha)}</CeldaTabla>
          <CeldaTabla etiqueta="Empleado">{nombres.get(a.empleado_id) ?? '—'}</CeldaTabla>
          <CeldaTabla etiqueta="Alerta">
            <span className="inline-block rounded-full bg-pastel-mantequilla px-3 py-0.5 font-semibold">
              {ETIQUETAS[a.codigo]}
            </span>
          </CeldaTabla>
          <CeldaTabla etiqueta="Detalle">{a.detalle}</CeldaTabla>
        </FilaTabla>
      ))}
    </TablaAdaptable>
  )
}
