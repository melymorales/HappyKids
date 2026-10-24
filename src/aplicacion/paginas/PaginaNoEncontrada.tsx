import { Link } from 'react-router-dom'

export function PaginaNoEncontrada() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col items-center justify-center gap-4 p-6 text-center">
      <h1 className="text-3xl">No encontramos esta página</h1>
      <p className="text-suave">Revisa la dirección o vuelve al inicio.</p>
      <Link
        to="/"
        className="rounded-2xl bg-violeta px-6 py-3 font-titulo text-lg text-white"
      >
        Ir al inicio
      </Link>
    </main>
  )
}
