import { useState, type FormEvent } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { EnlaceBoton } from '@/compartido/componentes/EnlaceBoton'
import { Logotipo } from '@/compartido/componentes/Logotipo'
import { validarNuevaClave } from '@/funcionalidades/autenticacion/esquemas/validarClave'
import { rutaInicioPorRol } from '@/nucleo/autenticacion/rutasPorRol'
import { useSesion } from '@/nucleo/autenticacion/useSesion'

export function PaginaCambiarClave() {
  const { perfil, cambiarClave, cerrarSesion } = useSesion()
  const navegar = useNavigate()
  const [nueva, setNueva] = useState('')
  const [confirmacion, setConfirmacion] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (!perfil) return <Navigate to="/ingresar" replace />

  const obligatorio = perfil.debe_cambiar_clave
  // Un empleado vuelve a "Mi perfil"; la administradora, a su panel.
  const destinoCancelar = perfil.rol === 'empleado' ? '/empleado/perfil' : rutaInicioPorRol(perfil.rol)

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    const problema = validarNuevaClave(nueva, confirmacion)
    if (problema) {
      setError(problema)
      return
    }
    setError(null)
    setEnviando(true)
    const mensaje = await cambiarClave(nueva)
    setEnviando(false)
    if (mensaje) {
      setError(mensaje)
      return
    }
    if (perfil) navegar(rutaInicioPorRol(perfil.rol), { replace: true })
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md flex-col justify-center gap-6 px-7 py-10">
      <Logotipo className="text-center text-4xl" />

      <form onSubmit={alEnviar} className="flex flex-col gap-4">
        <h1 className="text-3xl">{obligatorio ? 'Crea tu contraseña' : 'Cambiar contraseña'}</h1>
        {obligatorio && (
          <p className="text-suave">
            Por seguridad, debes cambiar la contraseña temporal antes de continuar.
          </p>
        )}

        <CampoTexto
          id="clave-nueva"
          etiqueta="Contraseña nueva"
          tipo="password"
          valor={nueva}
          alCambiar={setNueva}
          autoComplete="new-password"
          ayuda="Mínimo 8 caracteres, con letras y números."
        />
        <CampoTexto
          id="clave-confirmacion"
          etiqueta="Repite la contraseña"
          tipo="password"
          valor={confirmacion}
          alCambiar={setConfirmacion}
          autoComplete="new-password"
        />

        <div aria-live="polite">
          {error && (
            <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
              {error}
            </p>
          )}
        </div>

        <BotonPrincipal deshabilitado={enviando}>
          {enviando ? 'Guardando…' : 'Guardar contraseña'}
        </BotonPrincipal>

        {/* Mientras la contraseña temporal sea obligatoria de cambiar, no se puede cancelar. */}
        {!obligatorio && (
          <EnlaceBoton a={destinoCancelar} variante="secundario" anchoCompleto>
            Cancelar
          </EnlaceBoton>
        )}

        <button
          type="button"
          onClick={() => void cerrarSesion()}
          className="text-sm font-semibold text-violeta underline"
        >
          Cerrar sesión
        </button>
      </form>
    </main>
  )
}
