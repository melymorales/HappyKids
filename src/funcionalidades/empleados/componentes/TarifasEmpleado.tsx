import { useState } from 'react'
import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
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
  const [formularioAbierto, setFormularioAbierto] = useState(false)
  const [aviso, setAviso] = useState<string | null>(null)

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
        <TablaAdaptable encabezados={['Desde', 'Hasta', 'Modalidad', 'Tarifa']}>
          {tarifas.map((t) => (
            <FilaTabla key={t.id}>
              <CeldaTabla etiqueta="Desde">{formatoFechaCalendario(t.vigente_desde)}</CeldaTabla>
              <CeldaTabla etiqueta="Hasta">
                {t.vigente_hasta ? formatoFechaCalendario(t.vigente_hasta) : 'Sin fecha de fin'}
              </CeldaTabla>
              <CeldaTabla etiqueta="Modalidad">{etiquetaModalidad(t.modalidad_pago)}</CeldaTabla>
              <CeldaTabla etiqueta="Tarifa">
                {formatoColones(t.tarifa_crc)} {unidadModalidad(t.modalidad_pago)}
              </CeldaTabla>
            </FilaTabla>
          ))}
        </TablaAdaptable>
      )}

      <div aria-live="polite">
        {aviso && (
          <p role="status" className="mt-4 rounded-xl bg-pastel-menta px-4 py-3 text-sm">
            {aviso}
          </p>
        )}
      </div>

      <details
        open={formularioAbierto}
        onToggle={(evento) => {
          const abierto = evento.currentTarget.open
          setFormularioAbierto(abierto)
          if (abierto) setAviso(null)
        }}
        className="mt-5 rounded-2xl bg-pastel-lavanda p-4"
      >
        <summary className="cursor-pointer font-semibold">Agregar una tarifa nueva</summary>
        <div className="mt-4">
          <FormularioTarifa
            empleadoId={empleado.id}
            modalidadInicial={empleado.modalidad_pago}
            alGuardar={() => {
              setFormularioAbierto(false)
              setAviso('Tarifa guardada.')
            }}
          />
        </div>
      </details>
    </Tarjeta>
  )
}
