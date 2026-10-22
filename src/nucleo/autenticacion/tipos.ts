export type Rol = 'admin' | 'empleado'

/** Fila de la tabla `perfiles`. */
export interface Perfil {
  id: string
  rol: Rol
  nombre_completo: string
  correo: string
  activo: boolean
  debe_cambiar_clave: boolean
}
