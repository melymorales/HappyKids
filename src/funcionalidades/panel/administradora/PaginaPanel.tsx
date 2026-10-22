import { useSesion } from '@/nucleo/autenticacion/useSesion'

export function PaginaPanel() {
  const { perfil } = useSesion()
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl">Hola, {perfil?.nombre_completo}</h1>
      <p className="text-suave">
        Este es el panel de la administradora. Aquí irán los resúmenes del kínder y los accesos
        a empleados, asistencia, nómina, clientes y cobros.
      </p>
    </section>
  )
}
