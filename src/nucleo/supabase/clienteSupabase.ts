import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { entorno } from '@/nucleo/configuracion/entorno'

let cliente: SupabaseClient | null = null

/**
 * Devuelve el cliente de Supabase (se crea una sola vez).
 * Solo usa la clave pública: la seguridad real la dan las políticas RLS de la base de datos.
 */
export function obtenerClienteSupabase(): SupabaseClient {
  if (!entorno.supabaseConfigurado) {
    throw new Error('Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_CLAVE_PUBLICA.')
  }
  if (!cliente) {
    cliente = createClient(entorno.supabaseUrl, entorno.supabaseClavePublica, {
      auth: { persistSession: true, autoRefreshToken: true },
    })
  }
  return cliente
}
