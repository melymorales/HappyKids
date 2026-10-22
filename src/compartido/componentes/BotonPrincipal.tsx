import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  deshabilitado?: boolean
  tipo?: 'button' | 'submit'
  alPulsar?: () => void
}

export function BotonPrincipal({ children, deshabilitado = false, tipo = 'submit', alPulsar }: Props) {
  return (
    <button
      type={tipo}
      onClick={alPulsar}
      disabled={deshabilitado}
      className="h-[52px] w-full rounded-2xl bg-violeta font-titulo text-[19px] font-medium text-white disabled:opacity-60"
    >
      {children}
    </button>
  )
}
