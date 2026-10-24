import { NavLink, Outlet } from 'react-router-dom'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
import { Logotipo } from '@/compartido/componentes/Logotipo'
import { useSesion } from '@/nucleo/autenticacion/useSesion'

export interface EnlaceMenu {
  a: string
  texto: string
  /** Solo se marca como activo cuando la ruta coincide exactamente. */
  exacto?: boolean
}

interface Props {
  enlaces: EnlaceMenu[]
}

/**
 * Marco de las pantallas con sesión.
 * En teléfono: arriba el logo y "Salir"; debajo, el menú que se desliza de lado.
 * En pantallas grandes: todo en una sola fila.
 */
export function MarcoAplicacion({ enlaces }: Props) {
  const { perfil, cerrarSesion } = useSesion()

  return (
    <div className="min-h-dvh">
      <header className="border-b-2 border-pastel-lavanda bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-x-3 gap-y-2 px-4 py-3">
          <div className="order-1">
            <Logotipo className="text-2xl" />
          </div>

          <div className="order-2 flex items-center gap-3 text-sm sm:order-3">
            <span className="hidden text-suave sm:inline">{perfil?.nombre_completo}</span>
            <BotonMorado alPulsar={() => void cerrarSesion()}>Salir</BotonMorado>
          </div>

          <nav
            aria-label="Principal"
            className="order-3 -mx-4 flex w-[calc(100%+2rem)] gap-1 overflow-x-auto px-4 pb-1 sm:order-2 sm:mx-0 sm:w-auto sm:px-0 sm:pb-0"
          >
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.a}
                to={enlace.a}
                end={enlace.exacto}
                className={({ isActive }) =>
                  `shrink-0 whitespace-nowrap rounded-xl px-3 py-2 ${
                    isActive ? 'bg-pastel-lavanda font-semibold text-violeta' : 'text-tinta'
                  }`
                }
              >
                {enlace.texto}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
