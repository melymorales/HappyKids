import {
  FunctionsFetchError,
  FunctionsHttpError,
  FunctionsRelayError,
} from '@supabase/supabase-js'
import { obtenerClienteSupabase } from '@/nucleo/supabase/clienteSupabase'

const AYUDA_PUBLICACION =
  'Revisa que la función esté publicada con el nombre exacto y con la verificación JWT apagada.'

/**
 * Llama a una función de servidor de Supabase (carpeta supabase/functions).
 * Si falla, lanza un Error con un mensaje en español:
 *  - el que devolvió nuestra función, cuando es un error propio (correo repetido, datos inválidos...)
 *  - o una pista técnica cuando la falla viene de la publicación de la función.
 */
export async function invocarFuncion<T>(nombre: string, cuerpo: Record<string, any>): Promise<T> {
  const { data, error } = await obtenerClienteSupabase().functions.invoke(nombre, { body: cuerpo })

  if (error) {
    console.error(`Error al llamar a la función "${nombre}":`, error)

    if (error instanceof FunctionsHttpError) {
      const estado = error.context.status
      let mensajePropio: string | null = null
      let detalleTecnico: string | null = null
      try {
        const detalle = await error.context.json()
        if (typeof detalle?.error === 'string') mensajePropio = detalle.error
        else if (typeof detalle?.message === 'string') detalleTecnico = detalle.message
      } catch {
        // la respuesta no era JSON
      }
      if (mensajePropio) throw new Error(mensajePropio)
      throw new Error(
        `La función respondió con el error ${estado}${detalleTecnico ? ` ("${detalleTecnico}")` : ''}. ${AYUDA_PUBLICACION}`,
      )
    }

    if (error instanceof FunctionsFetchError) {
      throw new Error(`No pudimos contactar la función "${nombre}". ${AYUDA_PUBLICACION}`)
    }

    if (error instanceof FunctionsRelayError) {
      throw new Error(`Supabase no pudo ejecutar la función "${nombre}". ${AYUDA_PUBLICACION}`)
    }

    throw new Error('No pudimos completar la acción. Inténtalo de nuevo.')
  }

  return data as T
}