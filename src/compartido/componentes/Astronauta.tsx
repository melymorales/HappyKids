interface Props {
  className?: string
}

/** Astronauta de la marca (dibujo simple, decorativo). */
export function Astronauta({ className = '' }: Props) {
  const contorno = { stroke: '#D9D2F5', strokeWidth: 3 }
  return (
    <svg className={className} viewBox="0 0 140 160" aria-hidden="true">
      <rect x="26" y="58" width="88" height="74" rx="26" fill="#C9BFF5" />
      <rect x="44" y="118" width="20" height="30" rx="10" fill="#E4DEFF" />
      <rect x="76" y="118" width="20" height="30" rx="10" fill="#E4DEFF" />
      <rect x="38" y="68" width="64" height="58" rx="26" fill="#FFFFFF" {...contorno} />
      <ellipse cx="30" cy="92" rx="10" ry="18" fill="#FFFFFF" {...contorno} />
      <ellipse cx="110" cy="92" rx="10" ry="18" fill="#FFFFFF" {...contorno} />
      <circle cx="70" cy="46" r="36" fill="#FFFFFF" {...contorno} />
      <rect x="45" y="31" width="50" height="32" rx="16" fill="#5B4FC4" />
      <ellipse cx="58" cy="41" rx="8" ry="4" fill="#FFFFFF" opacity=".5" />
      <circle cx="58" cy="98" r="6" fill="#EE547B" />
      <circle cx="78" cy="98" r="6" fill="#EBDC52" />
    </svg>
  )
}
