import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { PantallaCarga } from '@/compartido/componentes/PantallaCarga'
import { rutaInicioPorRol } from '@/nucleo/autenticacion/rutasPorRol'
import type { Rol } from '@/nucleo/autenticacion/tipos'
import { useSesion } from '@/nucleo/autenticacion/useSesion'

interface Props {
  /** Roles que pueden entrar. Si no se indica, entra cualquier persona con sesión. */
  roles?: Rol[]
}

/**
 * Protege un grupo de rutas:
 * sin sesión -> /ingresar; con contraseña temporal -> /cambiar-clave;
 * con otro rol -> a su propia pantalla de inicio.
 */
export function RutaProtegida({ roles }: Props) {
  const { usuario, perfil, cargando } = useSesion()
  const ubicacion = useLocation()

  if (cargando) return <PantallaCarga />

  if (!usuario || !perfil) {
    return <Navigate to="/ingresar" replace />
  }

  if (perfil.debe_cambiar_clave && ubicacion.pathname !== '/cambiar-clave') {
    return <Navigate to="/cambiar-clave" replace />
  }

  if (roles && !roles.includes(perfil.rol)) {
    return <Navigate to={rutaInicioPorRol(perfil.rol)} replace />
  }

  return <Outlet />
}
