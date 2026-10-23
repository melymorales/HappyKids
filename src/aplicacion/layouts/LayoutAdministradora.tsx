import { MarcoAplicacion } from '@/aplicacion/layouts/MarcoAplicacion'

/** Menú de la administradora. Se agregan enlaces a medida que avanzan las fases. */
export function LayoutAdministradora() {
  return (
    <MarcoAplicacion
      enlaces={[
        { a: '/administradora', texto: 'Panel', exacto: true },
        { a: '/administradora/empleados', texto: 'Empleados' },
        { a: '/administradora/asistencia', texto: 'Asistencia' },
        { a: '/administradora/configuracion', texto: 'Configuración' },
      ]}
    />
  )
}
