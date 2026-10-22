import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { enrutador } from '@/aplicacion/rutas'
import { ProveedorSesion } from '@/nucleo/autenticacion/ProveedorSesion'

const clienteConsultas = new QueryClient({
  defaultOptions: {
    queries: { retry: 1, refetchOnWindowFocus: false },
  },
})

export function App() {
  return (
    <QueryClientProvider client={clienteConsultas}>
      <ProveedorSesion>
        <RouterProvider router={enrutador} />
      </ProveedorSesion>
    </QueryClientProvider>
  )
}
