import { useState } from 'react'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'

interface Props {
  titulo: string
  clave: string
  alCerrar?: () => void
}

/** Muestra una contraseña temporal una sola vez, con botón para copiarla. */
export function PanelClaveTemporal({ titulo, clave, alCerrar }: Props) {
  const [copiada, setCopiada] = useState(false)

  async function copiar() {
    try {
      await navigator.clipboard.writeText(clave)
      setCopiada(true)
    } catch {
      setCopiada(false)
    }
  }

  return (
    <div className="rounded-2xl bg-pastel-mantequilla p-4">
      <h3 className="text-lg">{titulo}</h3>
      <p className="mt-1 text-sm">
        Entrégala a la persona. Deberá cambiarla al ingresar y no se volverá a mostrar.
      </p>
      <p className="my-3 select-all rounded-xl bg-white px-4 py-3 text-center font-mono text-2xl tracking-wider">
        {clave}
      </p>
      <div className="flex flex-wrap gap-2">
        <BotonSecundario alPulsar={() => void copiar()}>{copiada ? 'Copiada' : 'Copiar'}</BotonSecundario>
        {alCerrar && <BotonSecundario alPulsar={alCerrar}>Listo</BotonSecundario>}
      </div>
    </div>
  )
}
