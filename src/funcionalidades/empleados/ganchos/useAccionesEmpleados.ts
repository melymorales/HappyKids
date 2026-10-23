import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  actualizarEmpleado,
  agregarTarifa,
  cambiarCorreoEmpleado,
  cambiarEstadoEmpleado,
  crearEmpleado,
  restablecerClaveEmpleado,
} from '@/funcionalidades/empleados/consultas/empleados'
import { clavesEmpleados } from '@/funcionalidades/empleados/ganchos/useConsultasEmpleados'

/** Después de cada cambio se vuelven a pedir los datos de empleados. */
function useRefrescarEmpleados() {
  const cliente = useQueryClient()
  return () => cliente.invalidateQueries({ queryKey: clavesEmpleados.todos })
}

export function useCrearEmpleado() {
  const refrescar = useRefrescarEmpleados()
  return useMutation({ mutationFn: crearEmpleado, onSuccess: refrescar })
}

export function useActualizarEmpleado() {
  const refrescar = useRefrescarEmpleados()
  return useMutation({ mutationFn: actualizarEmpleado, onSuccess: refrescar })
}

export function useCambiarEstadoEmpleado() {
  const refrescar = useRefrescarEmpleados()
  return useMutation({
    mutationFn: (datos: { id: string; activo: boolean }) => cambiarEstadoEmpleado(datos.id, datos.activo),
    onSuccess: refrescar,
  })
}

export function useAgregarTarifa() {
  const refrescar = useRefrescarEmpleados()
  return useMutation({ mutationFn: agregarTarifa, onSuccess: refrescar })
}

export function useRestablecerClave() {
  return useMutation({ mutationFn: restablecerClaveEmpleado })
}

export function useCambiarCorreo() {
  const refrescar = useRefrescarEmpleados()
  return useMutation({
    mutationFn: (datos: { perfilId: string; correo: string }) =>
      cambiarCorreoEmpleado(datos.perfilId, datos.correo),
    onSuccess: refrescar,
  })
}
