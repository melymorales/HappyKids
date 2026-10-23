import { useState, type FormEvent } from 'react'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { CampoAreaTexto } from '@/compartido/componentes/CampoAreaTexto'
import { CampoSeleccion } from '@/compartido/componentes/CampoSeleccion'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { fechaHoyCR } from '@/compartido/utilidades/formatoFechas'
import { validarEmpleado } from '@/funcionalidades/empleados/esquemas/validarEmpleado'
import {
  MODALIDADES,
  unidadModalidad,
  type ModalidadPago,
  type ResumenEmpleado,
  type ValoresFormularioEmpleado,
} from '@/funcionalidades/empleados/tipos'

interface Props {
  modo: 'crear' | 'editar'
  inicial?: ResumenEmpleado
  enviando: boolean
  error: string | null
  textoBoton: string
  alEnviar: (valores: ValoresFormularioEmpleado) => void
  alCancelar?: () => void
}

export function FormularioEmpleado({ modo, inicial, enviando, error, textoBoton, alEnviar, alCancelar }: Props) {
  const [valores, setValores] = useState<ValoresFormularioEmpleado>({
    nombre_completo: inicial?.nombre_completo ?? '',
    correo: inicial?.correo ?? '',
    puesto: inicial?.puesto ?? '',
    fecha_ingreso: inicial?.fecha_ingreso ?? fechaHoyCR(),
    notas: inicial?.notas ?? '',
    modalidad_pago: 'por_hora',
    tarifa: '',
  })
  const [errorLocal, setErrorLocal] = useState<string | null>(null)

  function cambiar<K extends keyof ValoresFormularioEmpleado>(campo: K, valor: ValoresFormularioEmpleado[K]) {
    setValores((actual) => ({ ...actual, [campo]: valor }))
  }

  function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const problema = validarEmpleado(valores, modo)
    setErrorLocal(problema)
    if (!problema) alEnviar(valores)
  }

  const mensaje = errorLocal ?? error

  return (
    <form onSubmit={enviar} className="flex flex-col gap-4">
      <CampoTexto
        id="nombre"
        etiqueta="Nombre completo"
        valor={valores.nombre_completo}
        alCambiar={(v) => cambiar('nombre_completo', v)}
        autoComplete="off"
      />

      {modo === 'crear' && (
        <CampoTexto
          id="correo-empleado"
          etiqueta="Correo electrónico"
          tipo="email"
          valor={valores.correo}
          alCambiar={(v) => cambiar('correo', v)}
          autoComplete="off"
          ayuda="Es el usuario con el que entrará al sistema."
        />
      )}

      <CampoTexto
        id="puesto"
        etiqueta="Puesto"
        valor={valores.puesto}
        alCambiar={(v) => cambiar('puesto', v)}
        autoComplete="off"
      />
      <CampoTexto
        id="fecha-ingreso"
        etiqueta="Fecha de ingreso"
        tipo="date"
        valor={valores.fecha_ingreso}
        alCambiar={(v) => cambiar('fecha_ingreso', v)}
      />

      {modo === 'crear' && (
        <>
          <CampoSeleccion
            id="modalidad"
            etiqueta="Modalidad de pago"
            valor={valores.modalidad_pago}
            alCambiar={(v) => cambiar('modalidad_pago', v as ModalidadPago)}
            opciones={MODALIDADES.map((m) => ({ valor: m.valor, etiqueta: m.etiqueta }))}
          />
          <CampoTexto
            id="tarifa"
            etiqueta={`Tarifa en colones (${unidadModalidad(valores.modalidad_pago)})`}
            valor={valores.tarifa}
            alCambiar={(v) => cambiar('tarifa', v)}
            modoEntrada="numeric"
            ayuda="Solo números enteros, sin decimales."
          />
        </>
      )}

      <CampoAreaTexto
        id="notas"
        etiqueta="Notas (opcional)"
        valor={valores.notas}
        alCambiar={(v) => cambiar('notas', v)}
      />

      <div aria-live="polite">
        {mensaje && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            {mensaje}
          </p>
        )}
      </div>

      <BotonPrincipal deshabilitado={enviando}>{enviando ? 'Guardando…' : textoBoton}</BotonPrincipal>
      {alCancelar && <BotonSecundario alPulsar={alCancelar}>Cancelar</BotonSecundario>}
    </form>
  )
}
