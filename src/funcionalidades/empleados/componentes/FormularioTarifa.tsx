import { useState, type FormEvent } from 'react'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { CampoSeleccion } from '@/compartido/componentes/CampoSeleccion'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { fechaHoyCR } from '@/compartido/utilidades/formatoFechas'
import { useAgregarTarifa } from '@/funcionalidades/empleados/ganchos/useAccionesEmpleados'
import { convertirTarifa, validarTarifaNueva } from '@/funcionalidades/empleados/esquemas/validarEmpleado'
import {
  MODALIDADES,
  unidadModalidad,
  type ModalidadPago,
} from '@/funcionalidades/empleados/tipos'

interface Props {
  empleadoId: string
  modalidadInicial: ModalidadPago | null
  /** Se llama cuando la tarifa se guardó correctamente. */
  alGuardar: () => void
}

export function FormularioTarifa({ empleadoId, modalidadInicial, alGuardar }: Props) {
  const agregar = useAgregarTarifa()
  const [modalidad, setModalidad] = useState<ModalidadPago>(modalidadInicial ?? 'por_hora')
  const [tarifa, setTarifa] = useState('')
  const [vigenteDesde, setVigenteDesde] = useState(fechaHoyCR())
  const [error, setError] = useState<string | null>(null)

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const problema = validarTarifaNueva(tarifa, vigenteDesde)
    if (problema) {
      setError(problema)
      return
    }
    setError(null)
    try {
      await agregar.mutateAsync({
        empleado_id: empleadoId,
        modalidad_pago: modalidad,
        tarifa_crc: convertirTarifa(tarifa) as number,
        vigente_desde: vigenteDesde,
      })
      setTarifa('')
      alGuardar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar la tarifa.')
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <CampoSeleccion
        id="modalidad-nueva"
        etiqueta="Modalidad de pago"
        valor={modalidad}
        alCambiar={(v) => setModalidad(v as ModalidadPago)}
        opciones={MODALIDADES.map((m) => ({ valor: m.valor, etiqueta: m.etiqueta }))}
      />
      <CampoTexto
        id="tarifa-nueva"
        etiqueta={`Tarifa en colones (${unidadModalidad(modalidad)})`}
        valor={tarifa}
        alCambiar={setTarifa}
        modoEntrada="numeric"
        placeholder="2500"
      />
      <CampoTexto
        id="vigente-desde"
        etiqueta="Aplica desde"
        tipo="date"
        valor={vigenteDesde}
        alCambiar={setVigenteDesde}
        ayuda="La tarifa anterior termina ese día. El historial no se borra ni se edita."
      />

      <div aria-live="polite">
        {error && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            {error}
          </p>
        )}
      </div>

      <BotonPrincipal deshabilitado={agregar.isPending}>
        {agregar.isPending ? 'Guardando…' : 'Guardar tarifa'}
      </BotonPrincipal>
    </form>
  )
}
