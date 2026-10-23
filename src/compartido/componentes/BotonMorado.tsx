import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  alPulsar?: () => void
  deshabilitado?: boolean
  tipo?: 'button' | 'submit'
}

/** Botón morado relleno, de tamaño ajustado al texto (para acciones dentro de pantallas). */
export function BotonMorado({ children, alPulsar, deshabilitado = false, tipo = 'button' }: Props) {
  return (
    <button
      type={tipo}
      onClick={alPulsar}
      disabled={deshabilitado}
      className="rounded-xl bg-violeta px-4 py-2 font-semibold text-white disabled:opacity-60"
    >
      {children}
    </button>
  )
}
