import { MarcoAplicacion } from '@/aplicacion/layouts/MarcoAplicacion'

/** Menú del empleado. Se agregan enlaces a medida que avanzan las fases. */
export function LayoutEmpleado() {
  return (
    <MarcoAplicacion
      enlaces={[
        { a: '/empleado', texto: 'Inicio', exacto: true },
        { a: '/empleado/asistencia', texto: 'Asistencia' },
        { a: '/empleado/perfil', texto: 'Mi perfil' },
      ]}
    />
  )
}
