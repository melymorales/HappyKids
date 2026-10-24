import type { EstadoSolicitud } from '@/funcionalidades/asistencia/tipos'

const ESTILOS: Record<EstadoSolicitud, { texto: string; clases: string }> = {
  pendiente: { texto: 'Pendiente', clases: 'bg-pastel-mantequilla' },
  aprobada: { texto: 'Aprobada', clases: 'bg-pastel-menta' },
  rechazada: { texto: 'Rechazada', clases: 'bg-pastel-rosa' },
}

interface Props {
  estado: EstadoSolicitud
}

export function InsigniaSolicitud({ estado }: Props) {
  const estilo = ESTILOS[estado]
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold text-tinta ${estilo.clases}`}>
      {estilo.texto}
    </span>
  )
}
