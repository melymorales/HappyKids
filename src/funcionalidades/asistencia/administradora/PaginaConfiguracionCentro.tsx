import { SeccionRedesPermitidas } from '@/funcionalidades/asistencia/componentes/SeccionRedesPermitidas'
import { SeccionUbicacionCentro } from '@/funcionalidades/asistencia/componentes/SeccionUbicacionCentro'
import { useCentro } from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'

export function PaginaConfiguracionCentro() {
  const centro = useCentro()

  return (
    <section className="flex max-w-3xl flex-col gap-5">
      <h1 className="text-3xl">Configuración de asistencia</h1>

      {centro.isLoading && <p className="text-suave">Cargando…</p>}
      {centro.isError && (
        <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
          No pudimos cargar la configuración.
        </p>
      )}
      {centro.data && <SeccionUbicacionCentro centro={centro.data} />}

      <SeccionRedesPermitidas />
    </section>
  )
}
