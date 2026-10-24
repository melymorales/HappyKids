import type { EstadoPago } from '@/funcionalidades/nomina/tipos'

interface Props {
  estado: EstadoPago
}

export function InsigniaPago({ estado }: Props) {
  return estado === 'pagada' ? (
    <span className="inline-block rounded-full bg-pastel-menta px-3 py-0.5 text-sm font-semibold text-tinta">
      Pagada
    </span>
  ) : (
    <span className="inline-block rounded-full bg-pastel-mantequilla px-3 py-0.5 text-sm font-semibold text-tinta">
      Pendiente
    </span>
  )
}
