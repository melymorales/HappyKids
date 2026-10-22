/** Variables de entorno de la aplicación (se definen en .env.local y en Cloudflare). */
const url = import.meta.env.VITE_SUPABASE_URL
const clavePublica = import.meta.env.VITE_SUPABASE_CLAVE_PUBLICA

export const entorno = {
  supabaseUrl: url ?? '',
  supabaseClavePublica: clavePublica ?? '',
  supabaseConfigurado: Boolean(url && clavePublica),
} as const
