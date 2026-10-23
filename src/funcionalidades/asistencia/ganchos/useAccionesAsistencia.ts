import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  actualizarCentro,
  agregarRed,
  cambiarEstadoRed,
  detectarMiRed,
  registrarMarca,
} from '@/funcionalidades/asistencia/consultas/asistencia'
import { clavesAsistencia } from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'
import type { PosicionMarca, TipoMarca } from '@/funcionalidades/asistencia/tipos'

/** Después de cada cambio se vuelven a pedir los datos de asistencia. */
function useRefrescarAsistencia() {
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: clavesAsistencia.todos })
}

export function useRegistrarMarca() {
  const refrescar = useRefrescarAsistencia()
  return useMutation({
    mutationFn: (datos: { tipo: TipoMarca; posicion: PosicionMarca | null }) =>
      registrarMarca(datos.tipo, datos.posicion),
    onSuccess: refrescar,
  })
}

export function useActualizarCentro() {
  const refrescar = useRefrescarAsistencia()
  return useMutation({ mutationFn: actualizarCentro, onSuccess: refrescar })
}

export function useDetectarRed() {
  return useMutation({ mutationFn: detectarMiRed })
}

export function useAgregarRed() {
  const refrescar = useRefrescarAsistencia()
  return useMutation({ mutationFn: agregarRed, onSuccess: refrescar })
}

export function useCambiarEstadoRed() {
  const refrescar = useRefrescarAsistencia()
  return useMutation({
    mutationFn: (datos: { id: string; activa: boolean }) => cambiarEstadoRed(datos.id, datos.activa),
    onSuccess: refrescar,
  })
}
