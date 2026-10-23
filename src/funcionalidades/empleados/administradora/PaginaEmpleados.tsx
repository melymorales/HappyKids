import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { CampoSeleccion } from '@/compartido/componentes/CampoSeleccion'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { TablaEmpleados } from '@/funcionalidades/empleados/componentes/TablaEmpleados'
import { useEmpleados } from '@/funcionalidades/empleados/ganchos/useConsultasEmpleados'

type FiltroEstado = 'activos' | 'inactivos' | 'todos'

export function PaginaEmpleados() {
  const { data, isLoading, isError } = useEmpleados()
  const [busqueda, setBusqueda] = useState('')
  const [estado, setEstado] = useState<FiltroEstado>('activos')

  const filtrados = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (data ?? []).filter((e) => {
      const coincideEstado = estado === 'todos' || (estado === 'activos') === e.activo
      const coincideTexto =
        texto === '' ||
        e.nombre_completo.toLowerCase().includes(texto) ||
        e.puesto.toLowerCase().includes(texto)
      return coincideEstado && coincideTexto
    })
  }, [data, busqueda, estado])

  return (
    <section className="flex flex-col gap-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl">Empleados</h1>
        <Link
          to="/administradora/empleados/nuevo"
          className="rounded-2xl bg-violeta px-5 py-3 font-titulo text-lg text-white"
        >
          Nuevo empleado
        </Link>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <CampoTexto
          id="buscar"
          etiqueta="Buscar por nombre o puesto"
          valor={busqueda}
          alCambiar={setBusqueda}
          requerido={false}
        />
        <CampoSeleccion
          id="filtro-estado"
          etiqueta="Mostrar"
          valor={estado}
          alCambiar={(v) => setEstado(v as FiltroEstado)}
          opciones={[
            { valor: 'activos', etiqueta: 'Solo activos' },
            { valor: 'inactivos', etiqueta: 'Solo inactivos' },
            { valor: 'todos', etiqueta: 'Todos' },
          ]}
        />
      </div>

      {isLoading && <p className="text-suave">Cargando empleados…</p>}
      {isError && (
        <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
          No pudimos cargar los empleados. Revisa tu conexión e inténtalo de nuevo.
        </p>
      )}
      {data && filtrados.length === 0 && (
        <p className="rounded-2xl bg-pastel-lavanda px-4 py-6 text-center text-suave">
          {data.length === 0
            ? 'Todavía no hay empleados registrados.'
            : 'No hay empleados que coincidan con la búsqueda.'}
        </p>
      )}
      {filtrados.length > 0 && <TablaEmpleados empleados={filtrados} />}
    </section>
  )
}
