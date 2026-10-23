import { useQuery } from '@tanstack/react-query'
import {
  listarEmpleados,
  listarTarifas,
  obtenerEmpleado,
  obtenerMiEmpleado,
} from '@/funcionalidades/empleados/consultas/empleados'

export const clavesEmpleados = {
  todos: ['empleados'] as const,
  lista: ['empleados', 'lista'] as const,
  detalle: (id: string) => ['empleados', 'detalle', id] as const,
  tarifas: (id: string) => ['empleados', 'tarifas', id] as const,
  mio: ['empleados', 'mio'] as const,
}

export function useEmpleados() {
  return useQuery({ queryKey: clavesEmpleados.lista, queryFn: listarEmpleados })
}

export function useEmpleado(id: string | undefined) {
  return useQuery({
    queryKey: clavesEmpleados.detalle(id ?? ''),
    queryFn: () => obtenerEmpleado(id as string),
    enabled: Boolean(id),
  })
}

export function useTarifasEmpleado(id: string | undefined) {
  return useQuery({
    queryKey: clavesEmpleados.tarifas(id ?? ''),
    queryFn: () => listarTarifas(id as string),
    enabled: Boolean(id),
  })
}

export function useMiEmpleado() {
  return useQuery({ queryKey: clavesEmpleados.mio, queryFn: obtenerMiEmpleado })
}
