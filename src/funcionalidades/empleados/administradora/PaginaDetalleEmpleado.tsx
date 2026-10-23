import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { DialogoConfirmacion } from '@/compartido/componentes/DialogoConfirmacion'
import { InsigniaEstado } from '@/compartido/componentes/InsigniaEstado'
import { AccesoEmpleado } from '@/funcionalidades/empleados/componentes/AccesoEmpleado'
import { DatosEmpleado } from '@/funcionalidades/empleados/componentes/DatosEmpleado'
import { TarifasEmpleado } from '@/funcionalidades/empleados/componentes/TarifasEmpleado'
import { useCambiarEstadoEmpleado } from '@/funcionalidades/empleados/ganchos/useAccionesEmpleados'
import { useEmpleado } from '@/funcionalidades/empleados/ganchos/useConsultasEmpleados'

export function PaginaDetalleEmpleado() {
  const { id } = useParams<{ id: string }>()
  const { data: empleado, isLoading, isError } = useEmpleado(id)
  const cambiarEstado = useCambiarEstadoEmpleado()
  const [error, setError] = useState<string | null>(null)
  const [confirmandoEstado, setConfirmandoEstado] = useState(false)

  if (isLoading) return <p className="text-suave">Cargando…</p>

  if (isError || !empleado) {
    return (
      <section className="flex flex-col gap-4">
        <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
          No encontramos a este empleado.
        </p>
        <Link to="/administradora/empleados" className="font-semibold text-violeta">
          Volver a empleados
        </Link>
      </section>
    )
  }

  async function aplicarCambioEstado() {
    if (!empleado) return
    setConfirmandoEstado(false)
    setError(null)
    try {
      await cambiarEstado.mutateAsync({ id: empleado.id, activo: !empleado.activo })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cambiar el estado.')
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <Link to="/administradora/empleados" className="text-sm font-semibold text-violeta">
        ← Volver a empleados
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-3xl">{empleado.nombre_completo}</h1>
          <InsigniaEstado activo={empleado.activo} />
        </div>
        <BotonSecundario alPulsar={() => setConfirmandoEstado(true)} deshabilitado={cambiarEstado.isPending}>
          {empleado.activo ? 'Desactivar empleado' : 'Reactivar empleado'}
        </BotonSecundario>
      </div>

      {error && (
        <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
          {error}
        </p>
      )}

      <DatosEmpleado key={`datos-${empleado.id}-${empleado.nombre_completo}-${empleado.puesto}`} empleado={empleado} />
      <TarifasEmpleado empleado={empleado} />
      <AccesoEmpleado key={`acceso-${empleado.perfil_id}-${empleado.correo}`} empleado={empleado} />

      <DialogoConfirmacion
        abierto={confirmandoEstado}
        titulo={empleado.activo ? `¿Desactivar a ${empleado.nombre_completo}?` : `¿Reactivar a ${empleado.nombre_completo}?`}
        mensaje={
          empleado.activo
            ? 'No podrá ingresar al sistema, pero su historial se conserva.'
            : 'Podrá volver a ingresar al sistema.'
        }
        textoConfirmar={empleado.activo ? 'Desactivar' : 'Reactivar'}
        alConfirmar={() => void aplicarCambioEstado()}
        alCancelar={() => setConfirmandoEstado(false)}
      />
    </section>
  )
}
