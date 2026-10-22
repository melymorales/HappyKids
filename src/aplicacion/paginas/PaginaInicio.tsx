import { Astronauta } from '@/compartido/componentes/Astronauta'
import { Logotipo } from '@/compartido/componentes/Logotipo'
import { entorno } from '@/nucleo/configuracion/entorno'

export function PaginaInicio() {
  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center gap-6 p-6 text-center">
      <div className="flex w-full flex-col items-center gap-2 rounded-[36px] bg-pastel-lavanda px-6 py-10">
        <Astronauta className="h-40 w-auto" />
        <Logotipo className="text-5xl" />
      </div>
      <h1 className="text-3xl">Sistema en construcción</h1>
      <p className="text-suave">
        Estamos preparando el sistema de administración de Happy Kids.
      </p>
      {/* Indicador temporal de la fase 1: se elimina en la fase 2. */}
      <p className="rounded-full bg-pastel-cielo px-4 py-1 text-sm text-suave">
        Conexión con Supabase: {entorno.supabaseConfigurado ? 'configurada' : 'falta configurar'}
      </p>
    </main>
  )
}
