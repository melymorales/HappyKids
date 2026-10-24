import type { ReactNode } from 'react'

interface PropsTabla {
  encabezados: string[]
  children: ReactNode
  /** Dibuja un marco alrededor de la tabla en pantallas grandes. */
  enmarcada?: boolean
}

/**
 * Tabla que en pantallas grandes se ve como tabla y en teléfono se convierte
 * en tarjetas apiladas (cada celda muestra su título a la izquierda).
 * Se usa junto con FilaTabla y CeldaTabla.
 */
export function TablaAdaptable({ encabezados, children, enmarcada = false }: PropsTabla) {
  const marco = enmarcada
    ? 'sm:overflow-hidden sm:rounded-3xl sm:border-2 sm:border-pastel-lavanda sm:bg-white'
    : ''
  return (
    <div className={marco}>
      <table className="block w-full text-left text-sm sm:table">
        <thead className="hidden sm:table-header-group">
          <tr className="border-b-2 border-pastel-lavanda text-suave">
            {encabezados.map((encabezado) => (
              <th key={encabezado} className="px-4 py-3 font-semibold">
                {encabezado}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="block sm:table-row-group">{children}</tbody>
      </table>
    </div>
  )
}

interface PropsFila {
  children: ReactNode
  /** Si se indica, toda la fila (o tarjeta) se puede pulsar. */
  alPulsar?: () => void
}

export function FilaTabla({ children, alPulsar }: PropsFila) {
  const interactiva = alPulsar ? 'cursor-pointer hover:bg-pastel-lavanda/50' : ''
  return (
    <tr
      onClick={alPulsar}
      className={`mb-3 block rounded-2xl border-2 border-pastel-lavanda bg-white px-4 py-2 sm:mb-0 sm:table-row sm:rounded-none sm:border-x-0 sm:border-t-0 sm:border-b sm:bg-transparent sm:p-0 sm:last:border-b-0 ${interactiva}`}
    >
      {children}
    </tr>
  )
}

interface PropsCelda {
  /** Título de la columna: se muestra a la izquierda cuando la fila es una tarjeta. */
  etiqueta: string
  children: ReactNode
}

export function CeldaTabla({ etiqueta, children }: PropsCelda) {
  return (
    <td
      data-etiqueta={etiqueta}
      className="flex items-center justify-between gap-4 py-1.5 text-right before:text-left before:font-semibold before:text-suave before:content-[attr(data-etiqueta)] sm:table-cell sm:px-4 sm:py-3 sm:text-left sm:before:content-none"
    >
      {children}
    </td>
  )
}
