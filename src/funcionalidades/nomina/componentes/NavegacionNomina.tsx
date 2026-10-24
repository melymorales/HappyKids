import { NavLink } from 'react-router-dom'

/** Pestañas de la sección de nómina de la administradora. */
export function NavegacionNomina() {
  const pestanas = [
    { a: '/administradora/nomina', texto: 'Quincenas', exacto: true },
    { a: '/administradora/nomina/grupos', texto: 'Grupos atendidos', exacto: false },
  ]

  return (
    <nav aria-label="Nómina" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {pestanas.map((p) => (
        <NavLink
          key={p.a}
          to={p.a}
          end={p.exacto}
          className={({ isActive }) =>
            `shrink-0 whitespace-nowrap rounded-2xl border-2 px-4 py-2 font-semibold ${
              isActive
                ? 'border-violeta bg-violeta text-white'
                : 'border-pastel-lavanda bg-white text-tinta'
            }`
          }
        >
          {p.texto}
        </NavLink>
      ))}
    </nav>
  )
}
