import { EnlaceBoton } from '@/compartido/componentes/EnlaceBoton'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoColones } from '@/compartido/utilidades/formatoColones'
import { formatoFechaCalendario } from '@/compartido/utilidades/formatoFechas'
import { useMiEmpleado } from '@/funcionalidades/empleados/ganchos/useConsultasEmpleados'
import { etiquetaModalidad, unidadModalidad } from '@/funcionalidades/empleados/tipos'

export function PaginaMiPerfil() {
  const { data: empleado, isLoading, isError } = useMiEmpleado()

  if (isLoading) return <p className="text-suave">Cargando…</p>

  if (isError || !empleado) {
    return (
      <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
        No pudimos cargar tu perfil. Si el problema continúa, habla con la administradora.
      </p>
    )
  }

  return (
    <section className="flex max-w-xl flex-col gap-5">
      <h1 className="text-3xl">Mi perfil</h1>
      <Tarjeta>
        <dl className="grid gap-3 sm:grid-cols-2">
          <div>
            <dt className="text-sm text-suave">Nombre</dt>
            <dd className="font-semibold">{empleado.nombre_completo}</dd>
          </div>
          <div>
            <dt className="text-sm text-suave">Correo</dt>
            <dd className="font-semibold">{empleado.correo}</dd>
          </div>
          <div>
            <dt className="text-sm text-suave">Puesto</dt>
            <dd className="font-semibold">{empleado.puesto}</dd>
          </div>
          <div>
            <dt className="text-sm text-suave">Fecha de ingreso</dt>
            <dd className="font-semibold">{formatoFechaCalendario(empleado.fecha_ingreso)}</dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-sm text-suave">Modalidad de pago</dt>
            <dd className="font-semibold">
              {empleado.tarifa_crc
                ? `${etiquetaModalidad(empleado.modalidad_pago)}: ${formatoColones(empleado.tarifa_crc)} ${unidadModalidad(empleado.modalidad_pago)}`
                : 'Todavía no tienes una tarifa registrada.'}
            </dd>
          </div>
        </dl>
      </Tarjeta>
      <div>
        <EnlaceBoton a="/cambiar-clave">Cambiar contraseña</EnlaceBoton>
      </div>
    </section>
  )
}
