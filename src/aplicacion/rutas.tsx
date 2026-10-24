import { createBrowserRouter } from 'react-router-dom'
import { LayoutAdministradora } from '@/aplicacion/layouts/LayoutAdministradora'
import { LayoutEmpleado } from '@/aplicacion/layouts/LayoutEmpleado'
import { PaginaInicio } from '@/aplicacion/paginas/PaginaInicio'
import { PaginaNoEncontrada } from '@/aplicacion/paginas/PaginaNoEncontrada'
import { PaginaAsistencia } from '@/funcionalidades/asistencia/administradora/PaginaAsistencia'
import { PaginaConfiguracionCentro } from '@/funcionalidades/asistencia/administradora/PaginaConfiguracionCentro'
import { PaginaCorrecciones } from '@/funcionalidades/asistencia/administradora/PaginaCorrecciones'
import { PaginaRevisionMarcas } from '@/funcionalidades/asistencia/administradora/PaginaRevisionMarcas'
import { PaginaMarcarAsistencia } from '@/funcionalidades/asistencia/empleado/PaginaMarcarAsistencia'
import { PaginaCambiarClave } from '@/funcionalidades/autenticacion/paginas/PaginaCambiarClave'
import { PaginaIngresar } from '@/funcionalidades/autenticacion/paginas/PaginaIngresar'
import { PaginaDetalleEmpleado } from '@/funcionalidades/empleados/administradora/PaginaDetalleEmpleado'
import { PaginaEmpleados } from '@/funcionalidades/empleados/administradora/PaginaEmpleados'
import { PaginaNuevoEmpleado } from '@/funcionalidades/empleados/administradora/PaginaNuevoEmpleado'
import { PaginaMiPerfil } from '@/funcionalidades/empleados/empleado/PaginaMiPerfil'
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
        children: [
          { index: true, element: <PaginaPanel /> },
          { path: 'empleados', element: <PaginaEmpleados /> },
          { path: 'empleados/nuevo', element: <PaginaNuevoEmpleado /> },
          { path: 'empleados/:id', element: <PaginaDetalleEmpleado /> },
          { path: 'asistencia', element: <PaginaAsistencia /> },
          { path: 'asistencia/revision', element: <PaginaRevisionMarcas /> },
          { path: 'asistencia/correcciones', element: <PaginaCorrecciones /> },
          { path: 'configuracion', element: <PaginaConfiguracionCentro /> },
        ],
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
        children: [
          { index: true, element: <PaginaInicioEmpleado /> },
          { path: 'asistencia', element: <PaginaMarcarAsistencia /> },
          { path: 'perfil', element: <PaginaMiPerfil /> },
        ],
      },
    ],
  },

  { path: '*', element: <PaginaNoEncontrada /> },
])
