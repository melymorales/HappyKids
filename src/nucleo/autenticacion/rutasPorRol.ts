import type { Rol } from '@/nucleo/autenticacion/tipos'

/** Pantalla de inicio de cada rol. */
export function rutaInicioPorRol(rol: Rol): string {
  return rol === 'admin' ? '/administradora' : '/empleado'
}
