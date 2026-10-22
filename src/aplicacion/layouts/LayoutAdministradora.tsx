import { MarcoAplicacion } from '@/aplicacion/layouts/MarcoAplicacion'

/** Menú de la administradora. Se agregan enlaces a medida que avanzan las fases. */
export function LayoutAdministradora() {
  return <MarcoAplicacion enlaces={[{ a: '/administradora', texto: 'Panel', exacto: true }]} />
}
