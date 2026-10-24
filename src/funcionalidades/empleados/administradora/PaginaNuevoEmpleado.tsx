import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { FormularioEmpleado } from '@/funcionalidades/empleados/componentes/FormularioEmpleado'
import { PanelClaveTemporal } from '@/funcionalidades/empleados/componentes/PanelClaveTemporal'
import { convertirTarifa } from '@/funcionalidades/empleados/esquemas/validarEmpleado'
import { useCrearEmpleado } from '@/funcionalidades/empleados/ganchos/useAccionesEmpleados'
import type { ValoresFormularioEmpleado } from '@/funcionalidades/empleados/tipos'

interface EmpleadoCreado {
  id: string
  nombre: string
  correo: string
  clave: string
}

export function PaginaNuevoEmpleado() {
  const navegar = useNavigate()
  const crear = useCrearEmpleado()
  const [error, setError] = useState<string | null>(null)
  const [creado, setCreado] = useState<EmpleadoCreado | null>(null)
  const [version, setVersion] = useState(0)

  async function alEnviar(valores: ValoresFormularioEmpleado) {
    setError(null)
    const tarifa = convertirTarifa(valores.tarifa)
    if (tarifa === null) {
      setError('Escribe la tarifa con números enteros, por ejemplo 2000.')
      return
    }
    try {
      const resultado = await crear.mutateAsync({
        correo: valores.correo.trim().toLowerCase(),
        nombre_completo: valores.nombre_completo.trim(),
        puesto: valores.puesto.trim(),
        fecha_ingreso: valores.fecha_ingreso,
        modalidad_pago: valores.modalidad_pago,
        tarifa_crc: tarifa,
        notas: valores.notas.trim(),
      })
      setCreado({
        id: resultado.empleado_id,
        nombre: valores.nombre_completo.trim(),
        correo: valores.correo.trim().toLowerCase(),
        clave: resultado.clave_temporal,
      })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos crear al empleado.')
    }
  }

  if (creado) {
    return (
      <section className="flex flex-col gap-5">
        <h1 className="text-3xl">Empleado creado</h1>
        <Tarjeta>
          <p className="mb-4">
            <strong>{creado.nombre}</strong> ya puede ingresar al sistema con el correo{' '}
            <strong className="break-all">{creado.correo}</strong>.
          </p>
          <PanelClaveTemporal titulo="Contraseña temporal" clave={creado.clave} />
          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              to={`/administradora/empleados/${creado.id}`}
              className="rounded-xl bg-violeta px-4 py-2 font-semibold text-white"
            >
              Ver empleado
            </Link>
            <BotonSecundario
              alPulsar={() => {
                setCreado(null)
                setVersion((v) => v + 1)
              }}
            >
              Crear otro
            </BotonSecundario>
          </div>
        </Tarjeta>
      </section>
    )
  }

  return (
    <section className="flex max-w-xl flex-col gap-5">
      <h1 className="text-3xl">Nuevo empleado</h1>
      <Tarjeta>
        <FormularioEmpleado
          key={version}
          modo="crear"
          enviando={crear.isPending}
          error={error}
          textoBoton="Crear empleado"
          alEnviar={(valores) => void alEnviar(valores)}
          alCancelar={() => navegar('/administradora/empleados')}
        />
      </Tarjeta>
    </section>
  )
}
