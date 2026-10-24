import { useEffect, useId, useState, type ReactNode } from 'react'
import { CampoAreaTexto } from '@/compartido/componentes/CampoAreaTexto'
import { DialogoConfirmacion } from '@/compartido/componentes/DialogoConfirmacion'

interface Props {
  abierto: boolean
  titulo: string
  descripcion: ReactNode
  etiquetaNota: string
  /** Si es verdadero, la nota debe tener al menos `longitudMinima` caracteres. */
  notaObligatoria?: boolean
  longitudMinima?: number
  textoConfirmar: string
  alConfirmar: (nota: string) => void
  alCancelar: () => void
  procesando?: boolean
}

/** Ventana de confirmación que además pide una nota o motivo. */
export function DialogoConNota({
  abierto,
  titulo,
  descripcion,
  etiquetaNota,
  notaObligatoria = false,
  longitudMinima = 3,
  textoConfirmar,
  alConfirmar,
  alCancelar,
  procesando = false,
}: Props) {
  const idCampo = useId()
  const [nota, setNota] = useState('')

  useEffect(() => {
    if (abierto) setNota('')
  }, [abierto])

  const valida = !notaObligatoria || nota.trim().length >= longitudMinima

  return (
    <DialogoConfirmacion
      abierto={abierto}
      titulo={titulo}
      mensaje={
        <div className="flex flex-col gap-3 text-tinta">
          <p className="text-suave">{descripcion}</p>
          <CampoAreaTexto id={idCampo} etiqueta={etiquetaNota} valor={nota} alCambiar={setNota} />
        </div>
      }
      textoConfirmar={textoConfirmar}
      alConfirmar={() => alConfirmar(nota.trim())}
      alCancelar={alCancelar}
      procesando={procesando}
      confirmarDeshabilitado={!valida}
    />
  )
}
