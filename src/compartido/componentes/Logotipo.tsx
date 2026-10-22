interface Props {
  className?: string
}

/**
 * Versión escrita del logo con los colores de marca.
 * Reemplazar por el logo vectorial de la clienta cuando lo entregue.
 */
export function Logotipo({ className = '' }: Props) {
  return (
    <div
      role="img"
      aria-label="Happy Kids"
      className={`font-titulo font-semibold tracking-wide ${className}`}
    >
      <span className="text-rosa">H</span>
      <span className="text-amarillo">a</span>
      <span className="text-verde">pp</span>
      <span className="text-lila">y</span>{' '}
      <span className="text-rosa">K</span>
      <span className="text-amarillo">i</span>
      <span className="text-verde">d</span>
      <span className="text-lila">s</span>
    </div>
  )
}
