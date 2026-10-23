import type { BanderaUbicacion } from '@/funcionalidades/asistencia/tipos'

const ESTILOS: Record<BanderaUbicacion, { texto: string; clases: string }> = {
  ok: { texto: 'En el kínder', clases: 'bg-pastel-menta' },
  fuera_de_radio: { texto: 'Fuera del radio', clases: 'bg-pastel-rosa' },
  sin_ubicacion: { texto: 'Sin ubicación', clases: 'bg-pastel-mantequilla' },
}

interface Props {
  bandera: BanderaUbicacion
}

export function InsigniaUbicacion({ bandera }: Props) {
  const estilo = ESTILOS[bandera]
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold text-tinta ${estilo.clases}`}>
      {estilo.texto}
    </span>
  )
}
