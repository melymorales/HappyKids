import { useState } from 'react'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoFechaCalendario } from '@/compartido/utilidades/formatoFechas'
import { FormularioEmpleado } from '@/funcionalidades/empleados/componentes/FormularioEmpleado'
import { useActualizarEmpleado } from '@/funcionalidades/empleados/ganchos/useAccionesEmpleados'
import type { ResumenEmpleado, ValoresFormularioEmpleado } from '@/funcionalidades/empleados/tipos'

interface Props {
  empleado: ResumenEmpleado
}

export function DatosEmpleado({ empleado }: Props) {
  const actualizar = useActualizarEmpleado()
  const [editando, setEditando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function guardar(valores: ValoresFormularioEmpleado) {
    setError(null)
    try {
      await actualizar.mutateAsync({
        id: empleado.id,
        nombre_completo: valores.nombre_completo.trim(),
        puesto: valores.puesto.trim(),
        fecha_ingreso: valores.fecha_ingreso,
        notas: valores.notas.trim(),
      })
      setEditando(false)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar los cambios.')
    }
  }

  if (editando) {
    return (
      <Tarjeta titulo="Editar datos">
        <FormularioEmpleado
          modo="editar"
          inicial={empleado}
          enviando={actualizar.isPending}
          error={error}
          textoBoton="Guardar cambios"
          alEnviar={(valores) => void guardar(valores)}
          alCancelar={() => setEditando(false)}
        />
      </Tarjeta>
    )
  }

  return (
    <Tarjeta titulo="Datos del empleado">
      <dl className="grid gap-3 sm:grid-cols-2">
        <div>
          <dt className="text-sm text-suave">Nombre completo</dt>
          <dd className="font-semibold">{empleado.nombre_completo}</dd>
        </div>
        <div>
          <dt className="text-sm text-suave">Puesto</dt>
          <dd className="font-semibold">{empleado.puesto}</dd>
        </div>
        <div>
          <dt className="text-sm text-suave">Fecha de ingreso</dt>
          <dd className="font-semibold">{formatoFechaCalendario(empleado.fecha_ingreso)}</dd>
        </div>
        <div>
          <dt className="text-sm text-suave">Notas</dt>
          <dd className="font-semibold">{empleado.notas ?? 'Sin notas'}</dd>
        </div>
      </dl>
      <div className="mt-4">
        <BotonMorado alPulsar={() => setEditando(true)}>Editar datos</BotonMorado>
      </div>
    </Tarjeta>
  )
}
