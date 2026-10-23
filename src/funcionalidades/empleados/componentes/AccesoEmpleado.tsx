import { useState } from 'react'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { BotonSecundario } from '@/compartido/componentes/BotonSecundario'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { Tarjeta } from '@/compartido/componentes/Tarjeta'
import { PanelClaveTemporal } from '@/funcionalidades/empleados/componentes/PanelClaveTemporal'
import { validarCorreo } from '@/funcionalidades/empleados/esquemas/validarEmpleado'
import {
  useCambiarCorreo,
  useRestablecerClave,
} from '@/funcionalidades/empleados/ganchos/useAccionesEmpleados'
import type { ResumenEmpleado } from '@/funcionalidades/empleados/tipos'

interface Props {
  empleado: ResumenEmpleado
}

export function AccesoEmpleado({ empleado }: Props) {
  const restablecer = useRestablecerClave()
  const cambiarCorreo = useCambiarCorreo()
  const [editandoCorreo, setEditandoCorreo] = useState(false)
  const [correoNuevo, setCorreoNuevo] = useState(empleado.correo)
  const [claveTemporal, setClaveTemporal] = useState<string | null>(null)
  const [aviso, setAviso] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function restablecerClave() {
    const confirmado = window.confirm(
      `Se creará una contraseña temporal nueva para ${empleado.nombre_completo}. La anterior dejará de funcionar. ¿Continuar?`,
    )
    if (!confirmado) return
    setError(null)
    setAviso(null)
    try {
      const resultado = await restablecer.mutateAsync(empleado.perfil_id)
      setClaveTemporal(resultado.clave_temporal)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos restablecer la contraseña.')
    }
  }

  async function guardarCorreo() {
    const problema = validarCorreo(correoNuevo)
    if (problema) {
      setError(problema)
      return
    }
    setError(null)
    try {
      await cambiarCorreo.mutateAsync({ perfilId: empleado.perfil_id, correo: correoNuevo.trim().toLowerCase() })
      setEditandoCorreo(false)
      setAviso('Correo actualizado. Desde ahora entrará al sistema con el correo nuevo.')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No pudimos cambiar el correo.')
    }
  }

  return (
    <Tarjeta titulo="Acceso al sistema">
      <p className="mb-3">
        Correo de ingreso: <strong>{empleado.correo}</strong>
      </p>

      {editandoCorreo ? (
        <div className="mb-3 flex flex-col gap-3">
          <CampoTexto
            id="correo-nuevo"
            etiqueta="Correo nuevo"
            tipo="email"
            valor={correoNuevo}
            alCambiar={setCorreoNuevo}
            autoComplete="off"
          />
          <BotonPrincipal tipo="button" alPulsar={() => void guardarCorreo()} deshabilitado={cambiarCorreo.isPending}>
            {cambiarCorreo.isPending ? 'Guardando…' : 'Guardar correo'}
          </BotonPrincipal>
          <BotonSecundario alPulsar={() => setEditandoCorreo(false)}>Cancelar</BotonSecundario>
        </div>
      ) : (
        <div className="flex flex-wrap gap-2">
          <BotonSecundario
            alPulsar={() => {
              setCorreoNuevo(empleado.correo)
              setAviso(null)
              setEditandoCorreo(true)
            }}
          >
            Cambiar correo
          </BotonSecundario>
          <BotonSecundario alPulsar={() => void restablecerClave()} deshabilitado={restablecer.isPending}>
            {restablecer.isPending ? 'Restableciendo…' : 'Restablecer contraseña'}
          </BotonSecundario>
        </div>
      )}

      <div aria-live="polite" className="mt-3 flex flex-col gap-3">
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
        {claveTemporal && (
          <PanelClaveTemporal
            titulo="Contraseña temporal nueva"
            clave={claveTemporal}
            alCerrar={() => setClaveTemporal(null)}
          />
        )}
      </div>
    </Tarjeta>
  )
}
