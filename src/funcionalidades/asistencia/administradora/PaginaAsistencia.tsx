import { useMemo, useState } from 'react'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { CampoSeleccion } from '@/compartido/componentes/CampoSeleccion'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { DialogoConNota } from '@/compartido/componentes/DialogoConNota'
import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoDuracion } from '@/compartido/utilidades/formatoDuracion'
import { fechaHoyCR, formatoFechaHora, sumarDias } from '@/compartido/utilidades/formatoFechas'
import { AlertasAsistencia } from '@/funcionalidades/asistencia/componentes/AlertasAsistencia'
import { InsigniaUbicacion } from '@/funcionalidades/asistencia/componentes/InsigniaUbicacion'
import { NavegacionAsistencia } from '@/funcionalidades/asistencia/componentes/NavegacionAsistencia'
import { TablaJornadas } from '@/funcionalidades/asistencia/componentes/TablaJornadas'
import {
  useRevisarMarca,
  useSolicitarCorreccion,
} from '@/funcionalidades/asistencia/ganchos/useAccionesAsistencia'
import {
  useAlertas,
  useJornadas,
  useMarcasDetalle,
  usePersonal,
} from '@/funcionalidades/asistencia/ganchos/useConsultasAsistencia'
import type { MarcaDetalle } from '@/funcionalidades/asistencia/tipos'

function EstadoMarca({ marca }: { marca: MarcaDetalle }) {
  if (marca.anulada) {
    return <span className="inline-block rounded-full bg-pastel-rosa px-3 py-0.5 text-sm font-semibold">Anulada</span>
  }
  if (marca.revision === 'revisada_ok') {
    return <span className="inline-block rounded-full bg-pastel-menta px-3 py-0.5 text-sm font-semibold">Aceptada</span>
  }
  if (marca.bandera_ubicacion !== 'ok') {
    return (
      <span className="inline-block rounded-full bg-pastel-mantequilla px-3 py-0.5 text-sm font-semibold">
        Por revisar
      </span>
    )
  }
  return <span className="text-suave">—</span>
}

export function PaginaAsistencia() {
  const hoy = fechaHoyCR()
  const [desde, setDesde] = useState(sumarDias(hoy, -6))
  const [hasta, setHasta] = useState(hoy)
  const [empleadoId, setEmpleadoId] = useState('')
  const [marcaAAnular, setMarcaAAnular] = useState<MarcaDetalle | null>(null)
  const [errorAnulacion, setErrorAnulacion] = useState<string | null>(null)

  const rangoValido = desde !== '' && hasta !== '' && desde <= hasta
  const filtroEmpleado = empleadoId === '' ? null : empleadoId

  const personal = usePersonal()
  const jornadas = useJornadas(desde, hasta, filtroEmpleado, rangoValido)
  const marcas = useMarcasDetalle(desde, hasta, filtroEmpleado, rangoValido)
  const alertas = useAlertas(desde, hasta, rangoValido)
  const anular = useSolicitarCorreccion()
  const revisar = useRevisarMarca()

  const nombres = useMemo(
    () => new Map((personal.data ?? []).map((p) => [p.id, p.nombre_completo])),
    [personal.data],
  )

  const alertasFiltradas = useMemo(
    () => (alertas.data ?? []).filter((a) => filtroEmpleado === null || a.empleado_id === filtroEmpleado),
    [alertas.data, filtroEmpleado],
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

  async function anularMarca(nota: string) {
    if (!marcaAAnular) return
    const marca = marcaAAnular
    setMarcaAAnular(null)
    setErrorAnulacion(null)
    try {
      if (marca.bandera_ubicacion !== 'ok' && marca.revision === null) {
        // Marca señalada sin revisar: se anula como revisión, para que quede en el historial.
        await revisar.mutateAsync({ marcaId: marca.id, aceptar: false, nota })
      } else {
        await anular.mutateAsync({
          tipo: 'anular',
          motivo: nota,
          empleadoId: marca.empleado_id,
          marcaObjetivoId: marca.id,
        })
      }
    } catch (e) {
      setErrorAnulacion(e instanceof Error ? e.message : 'No pudimos anular la marca.')
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl">Asistencia</h1>
      <NavegacionAsistencia />

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
          <Tarjeta titulo="Alertas">
            {alertas.isLoading && <p className="text-suave">Cargando…</p>}
            {alertas.isError && (
              <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
                No pudimos cargar las alertas.
              </p>
            )}
            {alertas.data && <AlertasAsistencia alertas={alertasFiltradas} nombres={nombres} />}
          </Tarjeta>

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
              <TablaAdaptable encabezados={['Empleado', 'Horas totales', 'Jornadas incompletas']}>
                {resumen.map((r) => (
                  <FilaTabla key={r.id}>
                    <CeldaTabla etiqueta="Empleado">{r.nombre}</CeldaTabla>
                    <CeldaTabla etiqueta="Horas totales">{formatoDuracion(r.minutos)}</CeldaTabla>
                    <CeldaTabla etiqueta="Jornadas incompletas">{r.incompletas}</CeldaTabla>
                  </FilaTabla>
                ))}
              </TablaAdaptable>
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
            {errorAnulacion && (
              <p role="alert" className="mb-3 rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
                {errorAnulacion}
              </p>
            )}
            {marcas.data && marcas.data.length === 0 && <p className="text-suave">No hay marcas en estas fechas.</p>}
            {marcas.data && marcas.data.length > 0 && (
              <TablaAdaptable
                encabezados={['Fecha y hora', 'Empleado', 'Tipo', 'Ubicación', 'Distancia', 'Red (IP)', 'Estado', 'Acción']}
              >
                {marcas.data.map((m) => (
                  <FilaTabla key={m.id}>
                    <CeldaTabla etiqueta="Fecha y hora">{formatoFechaHora(m.marcada_en)}</CeldaTabla>
                    <CeldaTabla etiqueta="Empleado">{m.nombre_completo}</CeldaTabla>
                    <CeldaTabla etiqueta="Tipo">{m.tipo === 'entrada' ? 'Entrada' : 'Salida'}</CeldaTabla>
                    <CeldaTabla etiqueta="Ubicación">
                      <InsigniaUbicacion bandera={m.bandera_ubicacion} />
                    </CeldaTabla>
                    <CeldaTabla etiqueta="Distancia">
                      {m.distancia_m === null ? '—' : `${m.distancia_m} m`}
                    </CeldaTabla>
                    <CeldaTabla etiqueta="Red (IP)">
                      <span className="break-all">{m.ip_origen}</span>
                    </CeldaTabla>
                    <CeldaTabla etiqueta="Estado">
                      <EstadoMarca marca={m} />
                    </CeldaTabla>
                    <CeldaTabla etiqueta="Acción">
                      {m.anulada ? (
                        <span className="text-suave">—</span>
                      ) : (
                        <BotonSecundario alPulsar={() => setMarcaAAnular(m)}>Anular</BotonSecundario>
                      )}
                    </CeldaTabla>
                  </FilaTabla>
                ))}
              </TablaAdaptable>
            )}
            {marcas.data && marcas.data.length === 500 && (
              <p className="mt-3 text-sm text-suave">
                Se muestran las 500 marcas más recientes. Acorta el rango de fechas para ver las demás.
              </p>
            )}
          </Tarjeta>
        </>
      )}

      <DialogoConNota
        abierto={marcaAAnular !== null}
        titulo="Anular marca"
        descripcion={
          marcaAAnular
            ? `Se anulará la ${marcaAAnular.tipo === 'entrada' ? 'entrada' : 'salida'} de ${marcaAAnular.nombre_completo} del ${formatoFechaHora(marcaAAnular.marcada_en)}. La marca original se conserva, pero deja de contar en las horas.`
            : ''
        }
        etiquetaNota="Motivo (obligatorio)"
        notaObligatoria
        longitudMinima={5}
        textoConfirmar="Anular marca"
        alConfirmar={(nota) => void anularMarca(nota)}
        alCancelar={() => setMarcaAAnular(null)}
        procesando={anular.isPending || revisar.isPending}
      />
    </section>
  )
}
