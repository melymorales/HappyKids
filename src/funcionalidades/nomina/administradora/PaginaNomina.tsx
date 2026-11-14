import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { BotonMorado } from '@/compartido/componentes/BotonMorado'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { DialogoConfirmacion } from '@/compartido/componentes/DialogoConfirmacion'
import { CeldaTabla, FilaTabla, TablaAdaptable } from '@/compartido/componentes/TablaAdaptable'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { formatoColones } from '@/compartido/utilidades/formatoColones'
import { formatoDuracion } from '@/compartido/utilidades/formatoDuracion'
import { fechaHoyCR, formatoFechaCalendario, sumarDias } from '@/compartido/utilidades/formatoFechas'
import { NavegacionNomina } from '@/funcionalidades/nomina/componentes/NavegacionNomina'
import { useGuardarPeriodo } from '@/funcionalidades/nomina/ganchos/useAccionesNomina'
import { useCalculoNomina, usePeriodos } from '@/funcionalidades/nomina/ganchos/useConsultasNomina'
import { etiquetaModalidad, textoTarifa } from '@/funcionalidades/nomina/tipos'
import { ultimaQuincenaTerminada } from '@/funcionalidades/nomina/utilidades/quincenas'

export function PaginaNomina() {
  const navegar = useNavigate()
  const hoy = fechaHoyCR()
  const inicial = ultimaQuincenaTerminada(hoy)
  const [desde, setDesde] = useState(inicial.desde)
  const [hasta, setHasta] = useState(inicial.hasta)
  const [confirmando, setConfirmando] = useState(false)
  const [errorGuardado, setErrorGuardado] = useState<string | null>(null)

  const rangoValido = desde !== '' && hasta !== '' && desde <= hasta
  const calculo = useCalculoNomina(desde, hasta, rangoValido)
  const periodos = usePeriodos()
  const guardar = useGuardarPeriodo()

  const terminada = rangoValido && hasta < hoy
  const total = useMemo(
    () => (calculo.data ?? []).reduce((suma, fila) => suma + fila.monto_crc, 0),
    [calculo.data],
  )
  const hayFilas = (calculo.data ?? []).length > 0
  // Horas en días sin tarifa: no se están pagando, así que no se permite guardar así.
  const hayHorasSinTarifa = (calculo.data ?? []).some(
    (f) => f.modalidad_pago === 'por_hora' && f.minutos_sin_tarifa > 0,
  )

  async function guardarQuincena() {
    setConfirmando(false)
    setErrorGuardado(null)
    try {
      const id = await guardar.mutateAsync({ desde, hasta })
      navegar(`/administradora/nomina/${id}`)
    } catch (e) {
      setErrorGuardado(e instanceof Error ? e.message : 'No pudimos guardar la quincena.')
    }
  }

  function usarUltimaQuincena() {
    const ultima = ultimaQuincenaTerminada(hoy)
    setDesde(ultima.desde)
    setHasta(ultima.hasta)
  }

  return (
    <section className="flex flex-col gap-5">
      <h1 className="text-3xl">Nómina</h1>
      <NavegacionNomina />

      <Tarjeta titulo="Calcular una quincena">
        <div className="grid gap-4 sm:grid-cols-2">
          <CampoTexto id="nomina-desde" etiqueta="Desde" tipo="date" valor={desde} alCambiar={setDesde} />
          <CampoTexto id="nomina-hasta" etiqueta="Hasta" tipo="date" valor={hasta} alCambiar={setHasta} />
        </div>
        <div className="mt-3">
          <BotonSecundario alPulsar={usarUltimaQuincena}>Usar la última quincena terminada</BotonSecundario>
        </div>

        {!rangoValido && (
          <p role="alert" className="mt-4 rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            La fecha de inicio no puede ser posterior a la fecha final.
          </p>
        )}

        {rangoValido && calculo.isLoading && <p className="mt-4 text-suave">Calculando…</p>}
        {rangoValido && calculo.isError && (
          <p role="alert" className="mt-4 rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            {calculo.error instanceof Error ? calculo.error.message : 'No pudimos calcular la quincena.'}
          </p>
        )}

        {calculo.data && calculo.data.length === 0 && (
          <p className="mt-4 rounded-2xl bg-pastel-lavanda px-4 py-4 text-center text-suave">
            No hay empleados para calcular en estas fechas.
          </p>
        )}

        {hayFilas && calculo.data && (
          <div className="mt-5 flex flex-col gap-4">
            <p className="text-sm text-suave">
              Esta es una vista previa: todavía no se guardó nada. Los montos se calculan con las marcas
              válidas, los grupos registrados y la tarifa vigente de cada día.
            </p>
            <TablaAdaptable
              encabezados={['Empleado', 'Modalidad', 'Tarifa', 'Horas', 'Grupos', 'Monto', 'Observaciones']}
            >
              {calculo.data.map((f) => (
                <FilaTabla key={f.empleado_id}>
                  <CeldaTabla etiqueta="Empleado">{f.nombre_completo}</CeldaTabla>
                  <CeldaTabla etiqueta="Modalidad">{etiquetaModalidad(f.modalidad_pago)}</CeldaTabla>
                  <CeldaTabla etiqueta="Tarifa">{textoTarifa(f.modalidad_pago, f.tarifa_crc)}</CeldaTabla>
                  <CeldaTabla etiqueta="Horas">
                    {f.modalidad_pago === 'por_hora' ? formatoDuracion(f.minutos_trabajados) : '—'}
                  </CeldaTabla>
                  <CeldaTabla etiqueta="Grupos">
                    {f.modalidad_pago === 'por_grupo' ? f.cantidad_grupos : '—'}
                  </CeldaTabla>
                  <CeldaTabla etiqueta="Monto">
                    <strong>{formatoColones(f.monto_crc)}</strong>
                  </CeldaTabla>
                  <CeldaTabla etiqueta="Observaciones">
                    {f.advertencia ? (
                      <span
                        className={`block rounded-xl px-3 py-2 text-left text-xs ${
                          f.minutos_sin_tarifa > 0 && f.modalidad_pago === 'por_hora'
                            ? 'bg-pastel-rosa font-semibold'
                            : 'bg-pastel-mantequilla'
                        }`}
                      >
                        {f.advertencia}
                      </span>
                    ) : (
                      <span className="text-suave">—</span>
                    )}
                  </CeldaTabla>
                </FilaTabla>
              ))}
            </TablaAdaptable>

            <p className="text-right text-lg">
              Total a pagar: <strong>{formatoColones(total)}</strong>
            </p>

            {!terminada && (
              <p role="status" className="rounded-xl bg-pastel-cielo px-4 py-3 text-sm">
                Esta quincena todavía no termina. Podrás guardarla a partir del{' '}
                {formatoFechaCalendario(sumarDias(hasta, 1))}.
              </p>
            )}
            {hayHorasSinTarifa && (
              <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
                Hay empleados con horas en días sin tarifa vigente: esas horas no se están pagando. Corrige la
                fecha de ingreso en la ficha del empleado (Editar datos) antes de guardar la quincena.
              </p>
            )}
            {errorGuardado && (
              <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
                {errorGuardado}
              </p>
            )}

            <div>
              <BotonMorado
                alPulsar={() => setConfirmando(true)}
                deshabilitado={!terminada || hayHorasSinTarifa || guardar.isPending}
              >
                {guardar.isPending ? 'Guardando…' : 'Guardar quincena'}
              </BotonMorado>
            </div>
          </div>
        )}
      </Tarjeta>

      <Tarjeta titulo="Quincenas guardadas">
        {periodos.isLoading && <p className="text-suave">Cargando…</p>}
        {periodos.isError && (
          <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
            No pudimos cargar las quincenas.
          </p>
        )}
        {periodos.data && periodos.data.length === 0 && (
          <p className="text-suave">Todavía no hay quincenas guardadas.</p>
        )}
        {periodos.data && periodos.data.length > 0 && (
          <TablaAdaptable encabezados={['Quincena', 'Empleados', 'Total', 'Pagos pendientes']}>
            {periodos.data.map((p) => (
              <FilaTabla key={p.id} alPulsar={() => navegar(`/administradora/nomina/${p.id}`)}>
                <CeldaTabla etiqueta="Quincena">
                  <span className="font-semibold">
                    {formatoFechaCalendario(p.fecha_inicio)} al {formatoFechaCalendario(p.fecha_fin)}
                  </span>
                </CeldaTabla>
                <CeldaTabla etiqueta="Empleados">{p.empleados}</CeldaTabla>
                <CeldaTabla etiqueta="Total">{formatoColones(p.total_crc)}</CeldaTabla>
                <CeldaTabla etiqueta="Pagos pendientes">
                  {p.pendientes === 0 ? (
                    <span className="inline-block rounded-full bg-pastel-menta px-3 py-0.5 text-sm font-semibold">
                      Todo pagado
                    </span>
                  ) : (
                    <span className="inline-block rounded-full bg-pastel-mantequilla px-3 py-0.5 text-sm font-semibold">
                      {p.pendientes} pendiente(s)
                    </span>
                  )}
                </CeldaTabla>
              </FilaTabla>
            ))}
          </TablaAdaptable>
        )}
      </Tarjeta>

      <DialogoConfirmacion
        abierto={confirmando}
        titulo="¿Guardar esta quincena?"
        mensaje={
          <>
            Se guardará el cálculo del {formatoFechaCalendario(desde)} al {formatoFechaCalendario(hasta)} por un
            total de <strong>{formatoColones(total)}</strong>. Después no se podrá modificar el cálculo: solo se
            marcarán los pagos como realizados.
          </>
        }
        textoConfirmar="Guardar quincena"
        alConfirmar={() => void guardarQuincena()}
        alCancelar={() => setConfirmando(false)}
      />
    </section>
  )
}
