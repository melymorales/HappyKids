import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Astronauta } from '@/compartido/componentes/Astronauta'
import { BotonPrincipal } from '@/compartido/componentes/BotonPrincipal'
import { CampoTexto } from '@/compartido/componentes/CampoTexto'
import { Logotipo } from '@/compartido/componentes/Logotipo'
import { entorno } from '@/nucleo/configuracion/entorno'
import { rutaInicioPorRol } from '@/nucleo/autenticacion/rutasPorRol'
import { useSesion } from '@/nucleo/autenticacion/useSesion'

export function PaginaIngresar() {
  const { usuario, perfil, errorAcceso, iniciarSesion } = useSesion()
  const [correo, setCorreo] = useState('')
  const [clave, setClave] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [enviando, setEnviando] = useState(false)

  if (usuario && perfil) {
    return <Navigate to={rutaInicioPorRol(perfil.rol)} replace />
  }

  async function alEnviar(evento: FormEvent<HTMLFormElement>) {
    evento.preventDefault()
    setError(null)
    setEnviando(true)
    const mensaje = await iniciarSesion(correo, clave)
    setEnviando(false)
    if (mensaje) setError(mensaje)
  }

  const mensajeVisible = error ?? errorAcceso

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col">
      <div className="flex h-[300px] flex-col items-center justify-center gap-1 rounded-b-[36px] bg-pastel-lavanda">
        <Astronauta className="h-36 w-auto" />
        <Logotipo className="text-4xl" />
      </div>

      <form onSubmit={alEnviar} className="flex flex-col gap-4 px-7 py-8">
        <h1 className="text-3xl">Ingresar</h1>

        {!entorno.supabaseConfigurado && (
          <p role="alert" className="rounded-xl bg-pastel-mantequilla px-4 py-3 text-sm">
            El sistema aún no está configurado (faltan las variables de Supabase).
          </p>
        )}

        <CampoTexto
          id="correo"
          etiqueta="Correo electrónico"
          tipo="email"
          valor={correo}
          alCambiar={setCorreo}
          autoComplete="username"
          placeholder="nombre@correo.com"
        />
        <CampoTexto
          id="clave"
          etiqueta="Contraseña"
          tipo="password"
          valor={clave}
          alCambiar={setClave}
          autoComplete="current-password"
          placeholder="Tu contraseña"
        />

        <div aria-live="polite">
          {mensajeVisible && (
            <p role="alert" className="rounded-xl bg-pastel-rosa px-4 py-3 text-sm">
              {mensajeVisible}
            </p>
          )}
        </div>

        <BotonPrincipal deshabilitado={enviando || !entorno.supabaseConfigurado}>
          {enviando ? 'Entrando…' : 'Entrar'}
        </BotonPrincipal>

        <p className="text-sm text-suave">
          ¿Olvidaste tu contraseña? Pídele a la administradora una nueva.
        </p>
      </form>
    </main>
  )
}
