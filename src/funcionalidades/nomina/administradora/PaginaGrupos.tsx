import { useMemo, useState, type FormEvent } from 'react'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { CampoAreaTexto } from '@/compartido/componentes/CampoAreaTexto'
import { CampoSeleccion } from '@/compartido/componentes/CampoSeleccion'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { fechaHoyCR, formatoFechaCalendario, sumarDias } from '@/compartido/utilidades/formatoFechas'
import { NavegacionNomina } from '@/funcionalidades/nomina/componentes/NavegacionNomina'
import { useRegistrarGrupos } from '@/funcionalidades/nomina/ganchos/useAccionesNomina'
import { useGrupos, usePersonalGrupos } from '@/funcionalidades/nomina/ganchos/useConsultasNomina'

export function PaginaGrupos() {
  const hoy = fechaHoyCR()
  const personal = usePersonalGrupos()
  const registrar = useRegistrarGrupos()
  const [empleadoId, setEmpleadoId] = useState('')
  const [fecha, setFecha] = useState(hoy)
  const [cantidad, setCantidad] = useState('')
  const [notas, setNotas] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [desde, setDesde] = useState(sumarDias(hoy, -30))
  const [hasta, setHasta] = useState(hoy)

  const rangoValido = desde !== '' && hasta !== '' && desde <= hasta
  const grupos = useGrupos(desde, hasta, rangoValido)

  const personasPorGrupo = useMemo(
    () => (personal.data ?? []).filter((p) => p.activo && p.modalidad_pago === 'por_grupo'),
    [personal.data],
  )
  const nombres = useMemo(
    () => new Map((personal.data ?? []).map((p) => [p.id, p.nombre_completo])),
    [personal.data],
  )

  async function enviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setAviso(null)
    const numero = Number(cantidad)
    if (empleadoId === '') {
      setError('Elige al empleado.')
      return
    }
    if (fecha === '') {
      setError('Elige la fecha.')
      return
    }
    if (cantidad.trim() === '' || !Number.isInteger(numero) || numero < 0 || numero > 50) {
      setError('La cantidad de grupos debe ser un número entero entre 0 y 50.')
      return
    }
    setError(null)
    try {
      await registrar.mutateAsync({ empleadoId, fecha, cantidad: numero, notas: notas.trim() })
      setCantidad('')
      setNotas('')
      setAviso('Grupos registrados.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos guardar los grupos.')
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl">Nómina</h1>
      <NavegacionNomina />

      <Tarjeta titulo="Registrar grupos atendidos">
        {personal.isLoading && <p className="text-suave">Cargando…</p>}
        {personal.data && personasPorGrupo.length === 0 && (
          <p className="rounded-xl bg-pastel-mantequilla px-4 py-3 text-sm">
            No hay empleados activos con pago por grupo. Cambia la modalidad de pago en la ficha del empleado
            para poder registrarle grupos.
          </p>
        )}
        {personasPorGrupo.length > 0 && (
          <form onSubmit={enviar} className="flex flex-col gap-4">
            <p className="text-sm text-suave">
              Si ya registraste grupos para esa persona en ese día, la cantidad nueva reemplaza a la anterior.
            </p>
            <CampoSeleccion
              id="grupos-empleado"
              etiqueta="Empleado"
              valor={empleadoId}
              alCambiar={setEmpleadoId}
              opciones={[
                { valor: '', etiqueta: 'Elige un empleado' },
                ...personasPorGrupo.map((p) => ({ valor: p.id, etiqueta: p.nombre_completo })),
              ]}
            />
            <CampoTexto id="grupos-fecha" etiqueta="Fecha" tipo="date" valor={fecha} alCambiar={setFecha} />
            <CampoTexto
              id="grupos-cantidad"
              etiqueta="Grupos atendidos ese día"
              valor={cantidad}
              alCambiar={setCantidad}
              modoEntrada="numeric"
              placeholder="3"
            />
            <CampoAreaTexto id="grupos-notas" etiqueta="Notas (opcional)" valor={notas} alCambiar={setNotas} />

            <div aria-live="polite" className="flex flex-col gap-3">
              {error && (
                <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
                  {error}
                </p>
              )}
              {aviso && (
                <p role="status" className="rounded-xl bg-pastel-menta px-4 py-3 text-sm">
                  {aviso}
                </p>
              )}
            </div>

            <BotonPrincipal deshabilitado={registrar.isPending}>
              {registrar.isPending ? 'Guardando…' : 'Guardar grupos'}
            </BotonPrincipal>
          </form>
        )}
      </Tarjeta>

      <Tarjeta titulo="Grupos registrados">
        <div className="mb-4 grid gap-4 sm:grid-cols-2">
          <CampoTexto id="grupos-desde" etiqueta="Desde" tipo="date" valor={desde} alCambiar={setDesde} />
          <CampoTexto id="grupos-hasta" etiqueta="Hasta" tipo="date" valor={hasta} alCambiar={setHasta} />
        </div>
        {!rangoValido && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            La fecha de inicio no puede ser posterior a la fecha final.
          </p>
        )}
        {rangoValido && grupos.isLoading && <p className="text-suave">Cargando…</p>}
        {rangoValido && grupos.isError && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            No pudimos cargar los grupos.
          </p>
        )}
        {grupos.data && grupos.data.length === 0 && <p className="text-suave">No hay grupos registrados en estas fechas.</p>}
        {grupos.data && grupos.data.length > 0 && (
          <TablaAdaptable encabezados={['Fecha', 'Empleado', 'Grupos', 'Notas']}>
            {grupos.data.map((g) => (
              <FilaTabla key={g.id}>
                <CeldaTabla etiqueta="Fecha">{formatoFechaCalendario(g.fecha)}</CeldaTabla>
                <CeldaTabla etiqueta="Empleado">{nombres.get(g.empleado_id) ?? '—'}</CeldaTabla>
                <CeldaTabla etiqueta="Grupos">{g.cantidad_grupos}</CeldaTabla>
                <CeldaTabla etiqueta="Notas">{g.notas ?? '—'}</CeldaTabla>
              </FilaTabla>
            ))}
          </TablaAdaptable>
        )}
      </Tarjeta>
    </section>
  )
}
