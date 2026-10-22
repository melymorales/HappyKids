import { createBrowserRouter } from 'react-router-dom'
import { PaginaInicio } from '@/aplicacion/paginas/PaginaInicio'
import { PaginaNoEncontrada } from '@/aplicacion/paginas/PaginaNoEncontrada'

/**
 * Mapa de rutas de la aplicación.
 * Fase 2: aquí se agregan el inicio de sesión y los grupos de rutas
 * protegidas por rol (administradora / empleado).
 */
export const enrutador = createBrowserRouter([
  { path: '/', element: <PaginaInicio /> },
  { path: '*', element: <PaginaNoEncontrada /> },
])
