import { useEffect, useId, useRef, type ReactNode } from 'react'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'

interface Props {
  abierto: boolean
  titulo: string
  mensaje: ReactNode
  textoConfirmar: string
  alConfirmar: () => void
  alCancelar: () => void
  procesando?: boolean
  confirmarDeshabilitado?: boolean
}

/**
 * Ventana de confirmación con el estilo de la aplicación
 * (reemplaza al cuadro "localhost dice..." del navegador).
 * Usa el elemento <dialog> nativo: atrapa el foco y se cierra con Escape.
 */
export function DialogoConfirmacion({
  abierto,
  titulo,
  mensaje,
  textoConfirmar,
  alConfirmar,
  alCancelar,
  procesando = false,
  confirmarDeshabilitado = false,
}: Props) {
  const referencia = useRef<HTMLDialogElement>(null)
  const idTitulo = useId()

  useEffect(() => {
    const dialogo = referencia.current
    if (!dialogo) return
    if (abierto && !dialogo.open) dialogo.showModal()
    if (!abierto && dialogo.open) dialogo.close()
  }, [abierto])

  return (
    <dialog
      ref={referencia}
      aria-labelledby={idTitulo}
      onCancel={(evento) => {
        evento.preventDefault()
        alCancelar()
      }}
      className="m-auto w-[calc(100%-2rem)] max-w-md rounded-3xl border-2 border-pastel-lavanda bg-white p-6 text-tinta backdrop:bg-tinta/40"
    >
      <h2 id={idTitulo} className="text-2xl">
        {titulo}
      </h2>
      <div className="mt-2 text-suave">{mensaje}</div>
      <div className="mt-6 flex flex-wrap justify-end gap-3">
        <BotonSecundario alPulsar={alCancelar} deshabilitado={procesando}>
          Cancelar
        </BotonSecundario>
        <BotonMorado alPulsar={alConfirmar} deshabilitado={procesando || confirmarDeshabilitado}>
          {procesando ? 'Procesando…' : textoConfirmar}
        </BotonMorado>
      </div>
    </dialog>
  )
}
