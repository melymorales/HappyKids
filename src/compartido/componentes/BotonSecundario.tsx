import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  alPulsar?: () => void
  deshabilitado?: boolean
  tipo?: 'button' | 'submit'
}

export function BotonSecundario({ children, alPulsar, deshabilitado = false, tipo = 'button' }: Props) {
  return (
    <button
      type={tipo}
      onClick={alPulsar}
      disabled={deshabilitado}
      className="rounded-xl border-2 border-borde px-4 py-2 font-semibold text-tinta disabled:opacity-60"
    >
      {children}
    </button>
  )
}
