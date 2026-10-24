import { useQuery } from '@tanstack/react-query'
import {
  contarPendientes,
  listarAlertas,
  listarCorrecciones,
  listarHistorialRevisiones,
  listarJornadas,
  listarMarcasDetalle,
  listarMarcasPorRevisar,
  listarMisCorrecciones,
  listarMisMarcas,
  listarPersonal,
  listarRedes,
  obtenerCentro,
} from '@/funcionalidades/asistencia/consultas/asistencia'

export const clavesAsistencia = {
  todos: ['asistencia'] as const,
  misMarcas: ['asistencia', 'mis-marcas'] as const,
  misCorrecciones: ['asistencia', 'mis-correcciones'] as const,
  jornadas: (desde: string, hasta: string, empleadoId: string | null) =>
    ['asistencia', 'jornadas', desde, hasta, empleadoId] as const,
  marcas: (desde: string, hasta: string, empleadoId: string | null) =>
    ['asistencia', 'marcas', desde, hasta, empleadoId] as const,
  porRevisar: ['asistencia', 'por-revisar'] as const,
  historialRevisiones: ['asistencia', 'historial-revisiones'] as const,
  correcciones: (filtro: string) => ['asistencia', 'correcciones', filtro] as const,
  alertas: (desde: string, hasta: string) => ['asistencia', 'alertas', desde, hasta] as const,
  pendientes: ['asistencia', 'pendientes'] as const,
  personal: ['asistencia', 'personal'] as const,
  centro: ['asistencia', 'centro'] as const,
  redes: ['asistencia', 'redes'] as const,
}

export function useMisMarcas() {
  return useQuery({ queryKey: clavesAsistencia.misMarcas, queryFn: listarMisMarcas })
}

export function useMisCorrecciones() {
  return useQuery({ queryKey: clavesAsistencia.misCorrecciones, queryFn: listarMisCorrecciones })
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

export function useMarcasPorRevisar() {
  return useQuery({ queryKey: clavesAsistencia.porRevisar, queryFn: listarMarcasPorRevisar })
}

export function useCorrecciones(filtro: 'pendientes' | 'resueltas') {
  return useQuery({
    queryKey: clavesAsistencia.correcciones(filtro),
    queryFn: () => listarCorrecciones(filtro),
  })
}

export function useAlertas(desde: string, hasta: string, habilitado = true) {
  return useQuery({
    queryKey: clavesAsistencia.alertas(desde, hasta),
    queryFn: () => listarAlertas(desde, hasta),
    enabled: habilitado,
  })
}

export function useConteosPendientes() {
  return useQuery({ queryKey: clavesAsistencia.pendientes, queryFn: contarPendientes })
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

export function useHistorialRevisiones() {
  return useQuery({ queryKey: clavesAsistencia.historialRevisiones, queryFn: listarHistorialRevisiones })
}
