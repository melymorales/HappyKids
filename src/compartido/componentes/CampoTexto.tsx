import type { ChangeEvent } from 'react'

interface Props {
  id: string
  etiqueta: string
  tipo?: 'text' | 'email' | 'password' | 'date'
  valor: string
  alCambiar: (valor: string) => void
  autoComplete?: string
  placeholder?: string
  ayuda?: string
  requerido?: boolean
  modoEntrada?: 'text' | 'numeric'
}

export function CampoTexto({
  id,
  etiqueta,
  tipo = 'text',
  valor,
  alCambiar,
  autoComplete,
  placeholder,
  ayuda,
  requerido = true,
  modoEntrada,
}: Props) {
  const idAyuda = ayuda ? `${id}-ayuda` : undefined
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[15px] font-bold">
        {etiqueta}
      </label>
      <input
        id={id}
        type={tipo}
        value={valor}
        onChange={(e: ChangeEvent<HTMLInputElement>) => alCambiar(e.target.value)}
        autoComplete={autoComplete}
        placeholder={placeholder}
        inputMode={modoEntrada}
        aria-describedby={idAyuda}
        required={requerido}
        className="h-12 rounded-[14px] border-2 border-borde bg-white px-3.5 text-base text-tinta placeholder:text-suave focus:border-violeta"
      />
      {ayuda && (
        <p id={idAyuda} className="text-sm text-suave">
          {ayuda}
        </p>
      )}
    </div>
  )
}
