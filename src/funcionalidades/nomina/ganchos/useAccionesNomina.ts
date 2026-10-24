import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  guardarPeriodo,
  marcarDetallePagado,
  marcarPeriodoPagado,
  registrarGrupos,
} from '@/funcionalidades/nomina/consultas/nomina'
import { clavesNomina } from '@/funcionalidades/nomina/ganchos/useConsultasNomina'

/** Después de cada cambio se vuelven a pedir los datos de nómina. */
function useRefrescarNomina() {
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: clavesNomina.todos })
}

export function useGuardarPeriodo() {
  const refrescar = useRefrescarNomina()
  return useMutation({ mutationFn: guardarPeriodo, onSuccess: refrescar })
}

export function useMarcarDetallePagado() {
  const refrescar = useRefrescarNomina()
  return useMutation({ mutationFn: marcarDetallePagado, onSuccess: refrescar })
}

export function useMarcarPeriodoPagado() {
  const refrescar = useRefrescarNomina()
  return useMutation({ mutationFn: marcarPeriodoPagado, onSuccess: refrescar })
}

export function useRegistrarGrupos() {
  const refrescar = useRefrescarNomina()
  return useMutation({ mutationFn: registrarGrupos, onSuccess: refrescar })
}
