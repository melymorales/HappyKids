import { useQuery } from '@tanstack/react-query'
import {
  listarJornadas,
  listarMarcasDetalle,
  listarMisMarcas,
  listarPersonal,
  listarRedes,
  obtenerCentro,
} from '@/funcionalidades/asistencia/consultas/asistencia'

export const clavesAsistencia = {
  todos: ['asistencia'] as const,
  misMarcas: ['asistencia', 'mis-marcas'] as const,
  jornadas: (desde: string, hasta: string, empleadoId: string | null) =>
    ['asistencia', 'jornadas', desde, hasta, empleadoId] as const,
  marcas: (desde: string, hasta: string, empleadoId: string | null) =>
    ['asistencia', 'marcas', desde, hasta, empleadoId] as const,
  personal: ['asistencia', 'personal'] as const,
  centro: ['asistencia', 'centro'] as const,
  redes: ['asistencia', 'redes'] as const,
}

export function useMisMarcas() {
  return useQuery({ queryKey: clavesAsistencia.misMarcas, queryFn: listarMisMarcas })
}

export function useJornadas(desde: string, hasta: string, empleadoId: string | null, habilitado = true) {
  return useQuery({
    queryKey: clavesAsistencia.jornadas(desde, hasta, empleadoId),
    queryFn: () => listarJornadas(desde, hasta, empleadoId),
    enabled: habilitado,
  })
}

export function useMarcasDetalle(desde: string, hasta: string, empleadoId: string | null, habilitado = true) {
  return useQuery({
    queryKey: clavesAsistencia.marcas(desde, hasta, empleadoId),
    queryFn: () => listarMarcasDetalle(desde, hasta, empleadoId),
    enabled: habilitado,
  })
}

export function usePersonal() {
  return useQuery({ queryKey: clavesAsistencia.personal, queryFn: listarPersonal })
}

export function useCentro() {
  return useQuery({ queryKey: clavesAsistencia.centro, queryFn: obtenerCentro })
}

export function useRedes() {
  return useQuery({ queryKey: clavesAsistencia.redes, queryFn: listarRedes })
}
