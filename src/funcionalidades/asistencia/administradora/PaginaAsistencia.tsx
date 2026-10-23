import { useMemo, useState } from 'react'
import { CampoSeleccion } from '@/compartido/componentes/CampoSeleccion'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoDuracion } from '@/compartido/utilidades/formatoDuracion'
import { fechaHoyCR, formatoFechaHora, sumarDias } from '@/compartido/utilidades/formatoFechas'
import { InsigniaUbicacion } from '@/funcionalidades/asistencia/componentes/InsigniaUbicacion'
import { TablaJornadas } from '@/funcionalidades/asistencia/componentes/TablaJornadas'
import {
  useJornadas,
  useMarcasDetalle,
  usePersonal,
} from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'

export function PaginaAsistencia() {
  const hoy = fechaHoyCR()
  const [desde, setDesde] = useState(sumarDias(hoy, -6))
  const [hasta, setHasta] = useState(hoy)
  const [empleadoId, setEmpleadoId] = useState('')

  const rangoValido = desde !== '' && hasta !== '' && desde <= hasta
  const filtroEmpleado = empleadoId === '' ? null : empleadoId

  const personal = usePersonal()
  const jornadas = useJornadas(desde, hasta, filtroEmpleado, rangoValido)
  const marcas = useMarcasDetalle(desde, hasta, filtroEmpleado, rangoValido)

  const nombres = useMemo(
    () => new Map((personal.data ?? []).map((p) => [p.id, p.nombre_completo])),
    [personal.data],
  )

  const resumen = useMemo(() => {
    const porEmpleado = new Map<string, { minutos: number; incompletas: number }>()
    for (const j of jornadas.data ?? []) {
      const actual = porEmpleado.get(j.empleado_id) ?? { minutos: 0, incompletas: 0 }
      actual.minutos += j.minutos
      if (j.incompleta && j.fecha !== hoy) actual.incompletas += 1
      porEmpleado.set(j.empleado_id, actual)
    }
    return [...porEmpleado.entries()]
      .map(([id, datos]) => ({ id, nombre: nombres.get(id) ?? '—', ...datos }))
      .sort((a, b) => a.nombre.localeCompare(b.nombre))
  }, [jornadas.data, nombres, hoy])

  const opcionesEmpleado = [
    { valor: '', etiqueta: 'Todos los empleados' },
    ...(personal.data ?? []).map((p) => ({
      valor: p.id,
      etiqueta: p.activo ? p.nombre_completo : `${p.nombre_completo} (inactivo)`,
    })),
  ]

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl">Asistencia</h1>

      <div className="grid gap-4 sm:grid-cols-3">
        <CampoTexto id="desde" etiqueta="Desde" tipo="date" valor={desde} alCambiar={setDesde} />
        <CampoTexto id="hasta" etiqueta="Hasta" tipo="date" valor={hasta} alCambiar={setHasta} />
        <CampoSeleccion
          id="filtro-empleado"
          etiqueta="Empleado"
          valor={empleadoId}
          alCambiar={setEmpleadoId}
          opciones={opcionesEmpleado}
        />
      </div>

      {!rangoValido && (
        <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
          La fecha de inicio no puede ser posterior a la fecha final.
        </p>
      )}

      {rangoValido && (
        <>
          <Tarjeta titulo="Resumen por empleado">
            {jornadas.isLoading && <p className="text-suave">Cargando…</p>}
            {jornadas.isError && (
              <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
                No pudimos cargar las horas.
              </p>
            )}
            {jornadas.data && resumen.length === 0 && (
              <p className="text-suave">No hay marcas en estas fechas.</p>
            )}
            {resumen.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-pastel-lavanda text-suave">
                      <th className="py-2 pr-4 font-semibold">Empleado</th>
                      <th className="py-2 pr-4 font-semibold">Horas totales</th>
                      <th className="py-2 font-semibold">Jornadas incompletas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resumen.map((r) => (
                      <tr key={r.id} className="border-b border-pastel-lavanda last:border-b-0">
                        <td className="py-2 pr-4">{r.nombre}</td>
                        <td className="py-2 pr-4">{formatoDuracion(r.minutos)}</td>
                        <td className="py-2">{r.incompletas}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </Tarjeta>

          <Tarjeta titulo="Horas por día">
            {jornadas.data && <TablaJornadas jornadas={jornadas.data} nombres={nombres} />}
          </Tarjeta>

          <Tarjeta titulo="Marcas">
            {marcas.isLoading && <p className="text-suave">Cargando…</p>}
            {marcas.isError && (
              <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
                No pudimos cargar las marcas.
              </p>
            )}
            {marcas.data && marcas.data.length === 0 && <p className="text-suave">No hay marcas en estas fechas.</p>}
            {marcas.data && marcas.data.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b-2 border-pastel-lavanda text-suave">
                      <th className="py-2 pr-4 font-semibold">Fecha y hora</th>
                      <th className="py-2 pr-4 font-semibold">Empleado</th>
                      <th className="py-2 pr-4 font-semibold">Tipo</th>
                      <th className="py-2 pr-4 font-semibold">Ubicación</th>
                      <th className="py-2 pr-4 font-semibold">Distancia</th>
                      <th className="py-2 font-semibold">Red (IP)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {marcas.data.map((m) => (
                      <tr key={m.id} className="border-b border-pastel-lavanda last:border-b-0">
                        <td className="py-2 pr-4">{formatoFechaHora(m.marcada_en)}</td>
                        <td className="py-2 pr-4">{m.nombre_completo}</td>
                        <td className="py-2 pr-4">{m.tipo === 'entrada' ? 'Entrada' : 'Salida'}</td>
                        <td className="py-2 pr-4">
                          <InsigniaUbicacion bandera={m.bandera_ubicacion} />
                        </td>
                        <td className="py-2 pr-4">{m.distancia_m === null ? '—' : `${m.distancia_m} m`}</td>
                        <td className="py-2">{m.ip_origen}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
            {marcas.data && marcas.data.length === 500 && (
              <p className="mt-3 text-sm text-suave">Se muestran las 500 marcas más recientes. Acorta el rango de fechas para ver las demás.</p>
            )}
          </Tarjeta>
        </>
      )}
    </section>
  )
}
