import type { ChangeEvent } from 'react'

export interface OpcionSeleccion {
  valor: string
  etiqueta: string
}

interface Props {
  id: string
  etiqueta: string
  valor: string
  alCambiar: (valor: string) => void
  opciones: OpcionSeleccion[]
  ayuda?: string
}

export function CampoSeleccion({ id, etiqueta, valor, alCambiar, opciones, ayuda }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-bold">
        {etiqueta}
      </label>
      <select
        id={id}
        value={valor}
        onChange={(e: ChangeEvent<HTMLSelectElement>) => alCambiar(e.target.value)}
        aria-describedby={idAyuda}
        className="h-12 rounded-[14px] border-2 border-borde bg-white px-3 text-base text-tinta focus:border-violeta"
      >
        {opciones.map((opcion) => (
          <option key={opcion.valor} value={opcion.valor}>
            {opcion.etiqueta}
          </option>
        ))}
      </select>
      {ayuda && (
        <p id={idAyuda} className="text-sm text-suave">
          {ayuda}
        </p>
      )}
    </div>
  )
}
