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

export function MarcoAplicacion({ enlaces }: Props) {
  const { perfil, cerrarSesion } = useSesion()

  return (
    <div className="min-h-screen">
      <header className="border-b-2 border-pastel-lavanda bg-white">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <Logotipo className="text-2xl" />

          <nav aria-label="Principal" className="flex gap-1">
            {enlaces.map((enlace) => (
              <NavLink
                key={enlace.a}
                to={enlace.a}
                end={enlace.exacto}
                className={({ isActive }) =>
                  isActive
                    ? 'rounded-xl bg-pastel-lavanda px-3 py-1.5 font-semibold text-violeta'
                    : 'rounded-xl px-3 py-1.5 text-tinta'
                }
              >
                {enlace.texto}
              </NavLink>
            ))}
          </nav>

          <div className="flex items-center gap-3 text-sm">
            <span className="text-suave">{perfil?.nombre_completo}</span>
            <BotonMorado alPulsar={() => void cerrarSesion()}>Salir</BotonMorado>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-4 py-6">
        <Outlet />
      </main>
    </div>
  )
}
