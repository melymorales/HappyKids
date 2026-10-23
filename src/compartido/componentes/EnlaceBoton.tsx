import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'

interface Props {
  a: string
  children: ReactNode
  variante?: 'principal' | 'secundario'
  anchoCompleto?: boolean
}

/** Enlace que se ve como botón: sirve para ir a otra pantalla. */
export function EnlaceBoton({ a, children, variante = 'principal', anchoCompleto = false }: Props) {
  const colores =
    variante === 'principal'
      ? 'bg-violeta text-white'
      : 'border-2 border-borde bg-white text-tinta'
  const tamano = anchoCompleto ? 'h-[52px] w-full' : 'px-5 py-3'
  return (
    <Link
      to={a}
      className={`inline-flex items-center justify-center rounded-2xl font-titulo text-lg font-medium ${colores} ${tamano}`}
    >
      {children}
    </Link>
  )
}
