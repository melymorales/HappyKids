interface Props {
  activo: boolean
}

export function InsigniaEstado({ activo }: Props) {
  return (
    <span
      className={`inline-block rounded-full px-3 py-0.5 text-sm font-semibold ${
        activo ? 'bg-pastel-menta text-tinta' : 'bg-pastel-rosa text-tinta'
      }`}
    >
      {activo ? 'Activo' : 'Inactivo'}
    </span>
  )
}
