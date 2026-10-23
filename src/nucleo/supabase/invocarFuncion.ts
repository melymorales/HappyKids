import { FunctionsHttpError } from '@supabase/supabase-js'
import { obtenerClienteSupabase } from '@/nucleo/supabase/clienteSupabase'

/**
 * Llama a una función de servidor de Supabase (carpeta supabase/functions).
 * Si falla, lanza un Error con el mensaje en español que devolvió la función.
 */
export async function invocarFuncion<T>(nombre: string, cuerpo: unknown): Promise<T> {
  const { data, error } = await obtenerClienteSupabase().functions.invoke(nombre, { body: cuerpo })

  if (error) {
    let mensaje: string | null = null
    if (error instanceof FunctionsHttpError) {
      try {
        const detalle = await error.context.json()
        if (typeof detalle?.error === 'string') mensaje = detalle.error
      } catch {
        // la respuesta no era JSON: se usa el mensaje general
      }
    }
    throw new Error(mensaje ?? 'No pudimos completar la acción. Inténtalo de nuevo.')
  }

  return data as T
}
