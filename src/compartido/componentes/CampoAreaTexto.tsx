import type { ChangeEvent } from 'react'

interface Props {
  id: string
  etiqueta: string
  valor: string
  alCambiar: (valor: string) => void
  ayuda?: string
}

export function CampoAreaTexto({ id, etiqueta, valor, alCambiar, ayuda }: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-bold">
        {etiqueta}
      </label>
      <textarea
        id={id}
        value={valor}
        rows={3}
        onChange={(e: ChangeEvent<HTMLTextAreaElement>) => alCambiar(e.target.value)}
        aria-describedby={idAyuda}
        className="rounded-[14px] border-2 border-borde bg-white px-3.5 py-3 text-base text-tinta focus:border-violeta"
      />
      {ayuda && (
        <p id={idAyuda} className="text-sm text-suave">
          {ayuda}
        </p>
      )}
    </div>
  )
}
