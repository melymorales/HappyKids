import { NavLink } from 'react-router-dom'
import { useConteosPendientes } from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'

/** Pestañas de la sección de asistencia de la administradora. */
export function NavegacionAsistencia() {
  const { data } = useConteosPendientes()

  const pestanas = [
    { a: '/administradora/asistencia', texto: 'Resumen', exacto: true, cantidad: 0 },
    { a: '/administradora/asistencia/revision', texto: 'Por revisar', exacto: false, cantidad: data?.porRevisar ?? 0 },
    { a: '/administradora/asistencia/correcciones', texto: 'Correcciones', exacto: false, cantidad: data?.correcciones ?? 0 },
  ]

  return (
    <nav aria-label="Asistencia" className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
      {pestanas.map((p) => (
        <NavLink
          key={p.a}
          to={p.a}
          end={p.exacto}
          className={({ isActive }) =>
            `flex shrink-0 items-center gap-2 whitespace-nowrap rounded-2xl border-2 px-4 py-2 font-semibold ${
              isActive
                ? 'border-violeta bg-violeta text-white'
                : 'border-pastel-lavanda bg-white text-tinta'
            }`
          }
        >
          {p.texto}
          {p.cantidad > 0 && (
            <span className="rounded-full bg-pastel-rosa px-2 text-sm text-tinta">{p.cantidad}</span>
          )}
        </NavLink>
      ))}
    </nav>
  )
}
