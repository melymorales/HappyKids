import { useQuery } from '@tanstack/react-query'
import {
  calcularNomina,
  listarDetallePeriodo,
  listarGrupos,
  listarMisQuincenas,
  listarPeriodos,
  listarPersonalGrupos,
  obtenerPeriodo,
} from '@/funcionalidades/nomina/consultas/nomina'

export const clavesNomina = {
  todos: ['nomina'] as const,
  calculo: (desde: string, hasta: string) => ['nomina', 'calculo', desde, hasta] as const,
  periodos: ['nomina', 'periodos'] as const,
  periodo: (id: string) => ['nomina', 'periodo', id] as const,
  detalle: (id: string) => ['nomina', 'detalle', id] as const,
  grupos: (desde: string, hasta: string) => ['nomina', 'grupos', desde, hasta] as const,
  personal: ['nomina', 'personal'] as const,
  mias: ['nomina', 'mias'] as const,
}

export function useCalculoNomina(desde: string, hasta: string, habilitado = true) {
  return useQuery({
    queryKey: clavesNomina.calculo(desde, hasta),
    queryFn: () => calcularNomina(desde, hasta),
    enabled: habilitado,
    retry: false,
  })
}

export function usePeriodos() {
  return useQuery({ queryKey: clavesNomina.periodos, queryFn: listarPeriodos })
}

export function usePeriodo(id: string | undefined) {
  return useQuery({
    queryKey: clavesNomina.periodo(id ?? ''),
    queryFn: () => obtenerPeriodo(id as string),
    enabled: Boolean(id),
  })
}

export function useDetallePeriodo(id: string | undefined) {
  return useQuery({
    queryKey: clavesNomina.detalle(id ?? ''),
    queryFn: () => listarDetallePeriodo(id as string),
    enabled: Boolean(id),
  })
}

export function useGrupos(desde: string, hasta: string, habilitado = true) {
  return useQuery({
    queryKey: clavesNomina.grupos(desde, hasta),
    queryFn: () => listarGrupos(desde, hasta),
    enabled: habilitado,
  })
}

export function usePersonalGrupos() {
  return useQuery({ queryKey: clavesNomina.personal, queryFn: listarPersonalGrupos })
}

export function useMisQuincenas() {
  return useQuery({ queryKey: clavesNomina.mias, queryFn: listarMisQuincenas })
}
