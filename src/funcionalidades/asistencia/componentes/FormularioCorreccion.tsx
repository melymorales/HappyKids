import { useState, type FormEvent } from 'react'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { CampoAreaTexto } from '@/compartido/componentes/CampoAreaTexto'
import { CampoSeleccion } from '@/compartido/componentes/CampoSeleccion'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { fechaHoyCR } from '@/compartido/utilidades/formatoFechas'
import { useSolicitarCorreccion } from '@/funcionalidades/asistencia/ganchos/useAccionesAsistencia'
import type { PersonalSimple, TipoMarca } from '@/funcionalidades/asistencia/tipos'

interface Props {
  /** Si se indica, la persona que usa el formulario es la administradora y elige al empleado. */
  personal?: PersonalSimple[]
  alGuardar: () => void
  alCancelar: () => void
}

/** Pedir (o registrar) una marca de entrada o salida que se olvidó. */
export function FormularioCorreccion({ personal, alGuardar, alCancelar }: Props) {
  const solicitar = useSolicitarCorreccion()
  const esAdministradora = personal !== undefined
  const [empleadoId, setEmpleadoId] = useState('')
  const [tipoMarca, setTipoMarca] = useState<TipoMarca>('entrada')
  const [fecha, setFecha] = useState(fechaHoyCR())
  const [hora, setHora] = useState('')
  const [motivo, setMotivo] = useState('')
  const [error, setError] = useState<string | null>(null)

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    if (esAdministradora && empleadoId === '') {
      setError('Elige al empleado.')
      return
    }
    if (fecha === '' || hora === '') {
      setError('Indica la fecha y la hora de la marca.')
      return
    }
    // Costa Rica no usa horario de verano: siempre es UTC-6.
    const instante = new Date(`${fecha}T${hora}:00-06:00`)
    if (Number.isNaN(instante.getTime())) {
      setError('La fecha o la hora no son válidas.')
      return
    }
    if (instante.getTime() > Date.now()) {
      setError('La hora no puede estar en el futuro.')
      return
    }
    if (motivo.trim().length < 5) {
      setError('Explica el motivo (al menos 5 caracteres).')
      return
    }
    setError(null)
    try {
      await solicitar.mutateAsync({
        tipo: 'agregar',
        motivo: motivo.trim(),
        empleadoId: esAdministradora ? empleadoId : null,
        tipoMarca,
        hora: instante.toISOString(),
      })
      alGuardar()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos enviar la solicitud.')
    }
  }

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4 rounded-2xl bg-pastel-lavanda p-4">
      <h3 className="text-lg">{esAdministradora ? 'Registrar una marca olvidada' : 'Pedir una corrección'}</h3>
      <p className="text-sm text-suave">
        {esAdministradora
          ? 'La marca se agrega y queda aprobada de inmediato. Se conserva quién la registró y el motivo.'
          : 'Indica la marca que olvidaste. La administradora la revisará antes de que cuente en tus horas.'}
      </p>

      {esAdministradora && (
        <CampoSeleccion
          id="correccion-empleado"
          etiqueta="Empleado"
          valor={empleadoId}
          alCambiar={setEmpleadoId}
          opciones={[
            { valor: '', etiqueta: 'Elige un empleado' },
            ...personal.map((p) => ({
              valor: p.id,
              etiqueta: p.activo ? p.nombre_completo : `${p.nombre_completo} (inactivo)`,
            })),
          ]}
        />
      )}

      <CampoSeleccion
        id="correccion-tipo"
        etiqueta="¿Qué marca olvidaste?"
        valor={tipoMarca}
        alCambiar={(v) => setTipoMarca(v as TipoMarca)}
        opciones={[
          { valor: 'entrada', etiqueta: 'Entrada' },
          { valor: 'salida', etiqueta: 'Salida' },
        ]}
      />
      <CampoTexto id="correccion-fecha" etiqueta="Fecha" tipo="date" valor={fecha} alCambiar={setFecha} />
      <CampoTexto id="correccion-hora" etiqueta="Hora" tipo="time" valor={hora} alCambiar={setHora} />
      <CampoAreaTexto
        id="correccion-motivo"
        etiqueta="Motivo"
        valor={motivo}
        alCambiar={setMotivo}
        ayuda="Por ejemplo: olvidé marcar la salida porque salí corriendo."
      />

      <div aria-live="polite">
        {error && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            {error}
          </p>
        )}
      </div>

      <BotonPrincipal deshabilitado={solicitar.isPending}>
        {solicitar.isPending ? 'Enviando…' : esAdministradora ? 'Registrar marca' : 'Enviar solicitud'}
      </BotonPrincipal>
      <BotonSecundario alPulsar={alCancelar} deshabilitado={solicitar.isPending}>
        Cancelar
      </BotonSecundario>
    </form>
  )
}
