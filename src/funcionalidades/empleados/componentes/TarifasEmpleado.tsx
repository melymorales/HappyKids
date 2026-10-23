import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoColones } from '@/compartido/utilidades/formatoColones'
import { formatoFechaCalendario } from '@/compartido/utilidades/formatoFechas'
import { FormularioTarifa } from '@/funcionalidades/empleados/componentes/FormularioTarifa'
import { useTarifasEmpleado } from '@/funcionalidades/empleados/ganchos/useConsultasEmpleados'
import {
  etiquetaModalidad,
  unidadModalidad,
  type ResumenEmpleado,
} from '@/funcionalidades/empleados/tipos'

interface Props {
  empleado: ResumenEmpleado
}

export function TarifasEmpleado({ empleado }: Props) {
  const { data: tarifas, isLoading, isError } = useTarifasEmpleado(empleado.id)

  return (
    <Tarjeta titulo="Modalidad de pago y tarifa">
      <p className="mb-4">
        {empleado.tarifa_crc && empleado.modalidad_pago ? (
          <>
            <strong>{etiquetaModalidad(empleado.modalidad_pago)}</strong>:{' '}
            {formatoColones(empleado.tarifa_crc)} {unidadModalidad(empleado.modalidad_pago)}
          </>
        ) : (
          'No hay una tarifa vigente hoy.'
        )}
      </p>

      <h3 className="mb-2 text-lg">Historial</h3>
      {isLoading && <p className="text-suave">Cargando…</p>}
      {isError && (
        <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
          No pudimos cargar el historial de tarifas.
        </p>
      )}
      {tarifas && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b-2 border-pastel-lavanda text-suave">
                <th className="py-2 pr-4 font-semibold">Desde</th>
                <th className="py-2 pr-4 font-semibold">Hasta</th>
                <th className="py-2 pr-4 font-semibold">Modalidad</th>
                <th className="py-2 font-semibold">Tarifa</th>
              </tr>
            </thead>
            <tbody>
              {tarifas.map((t) => (
                <tr key={t.id} className="border-b border-pastel-lavanda">
                  <td className="py-2 pr-4">{formatoFechaCalendario(t.vigente_desde)}</td>
                  <td className="py-2 pr-4">
                    {t.vigente_hasta ? formatoFechaCalendario(t.vigente_hasta) : 'Sin fecha de fin'}
                  </td>
                  <td className="py-2 pr-4">{etiquetaModalidad(t.modalidad_pago)}</td>
                  <td className="py-2">
                    {formatoColones(t.tarifa_crc)} {unidadModalidad(t.modalidad_pago)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <details className="mt-5 rounded-2xl bg-pastel-lavanda p-4">
        <summary className="cursor-pointer font-semibold">Agregar una tarifa nueva</summary>
        <div className="mt-4">
          <FormularioTarifa empleadoId={empleado.id} modalidadInicial={empleado.modalidad_pago} />
        </div>
      </details>
    </Tarjeta>
  )
}
