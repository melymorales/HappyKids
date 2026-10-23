import type { ReactNode } from 'react'

interface Props {
  titulo?: string
  children: ReactNode
}

export function Tarjeta({ titulo, children }: Props) {
  return (
    <section className="rounded-3xl border-2 border-pastel-lavanda bg-white p-5">
      {titulo && <h2 className="mb-3 text-xl">{titulo}</h2>}
      {children}
    </section>
  )
}
