import { useSesion } from '@/nucleo/autenticacion/useSesion'

export function PaginaInicioEmpleado() {
  const { perfil } = useSesion()
  return (
    <section className="flex flex-col gap-4">
      <h1 className="text-3xl">Hola, {perfil?.nombre_completo}</h1>
      <p className="text-suave">
        Pronto podrás marcar tu asistencia, ver tus horas y quincenas, y pedir permisos desde aquí.
      </p>
    </section>
  )
}
