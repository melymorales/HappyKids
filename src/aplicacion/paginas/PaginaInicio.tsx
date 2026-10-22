import { Navigate } from 'react-router-dom'
import { PantallaCarga } from '@/compartido/componentes/PantallaCarga'
import { rutaInicioPorRol } from '@/nucleo/autenticacion/rutasPorRol'
import { useSesion } from '@/nucleo/autenticacion/useSesion'

/** Ruta "/": envía a cada persona a su pantalla, o al inicio de sesión. */
export function PaginaInicio() {
  const { perfil, cargando } = useSesion()
  if (cargando) return <PantallaCarga />
  if (perfil) return <Navigate to={rutaInicioPorRol(perfil.rol)} replace />
  return <Navigate to="/ingresar" replace />
}
