import { createBrowserRouter } from 'react-router-dom'
import { LayoutAdministradora } from '@/aplicacion/layouts/LayoutAdministradora'
import { LayoutEmpleado } from '@/aplicacion/layouts/LayoutEmpleado'
import { PaginaInicio } from '@/aplicacion/paginas/PaginaInicio'
import { PaginaNoEncontrada } from '@/aplicacion/paginas/PaginaNoEncontrada'
import { PaginaCambiarClave } from '@/funcionalidades/autenticacion/paginas/PaginaCambiarClave'
import { PaginaIngresar } from '@/funcionalidades/autenticacion/paginas/PaginaIngresar'
import { PaginaPanel } from '@/funcionalidades/panel/administradora/PaginaPanel'
import { PaginaInicioEmpleado } from '@/funcionalidades/panel/empleado/PaginaInicioEmpleado'
import { RutaProtegida } from '@/nucleo/autenticacion/guardas/RutaProtegida'

/**
 * Mapa de rutas de la aplicación.
 * Cada fase agrega sus pantallas dentro del grupo de rutas de su rol.
 */
export const enrutador = createBrowserRouter([
  { path: '/', element: <PaginaInicio /> },
  { path: '/ingresar', element: <PaginaIngresar /> },

  // Cualquier persona con sesión
  {
    element: <RutaProtegida />,
    children: [{ path: '/cambiar-clave', element: <PaginaCambiarClave /> }],
  },

  // Solo administradora
  {
    element: <RutaProtegida roles={['admin']} />,
    children: [
      {
        path: '/administradora',
        element: <LayoutAdministradora />,
        children: [{ index: true, element: <PaginaPanel /> }],
      },
    ],
  },

  // Solo empleado
  {
    element: <RutaProtegida roles={['empleado']} />,
    children: [
      {
        path: '/empleado',
        element: <LayoutEmpleado />,
        children: [{ index: true, element: <PaginaInicioEmpleado /> }],
      },
    ],
  },

  { path: '*', element: <PaginaNoEncontrada /> },
])
