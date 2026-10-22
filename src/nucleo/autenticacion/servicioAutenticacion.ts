import type { AuthError } from '@supabase/supabase-js'
import type { Perfil } from '@/nucleo/autenticacion/tipos'
import { obtenerClienteSupabase } from '@/nucleo/supabase/clienteSupabase'

function mensajeInicioSesion(error: AuthError): string {
  if (error.status === 429 || error.code === 'over_request_rate_limit') {
    return 'Demasiados intentos. Espera unos minutos e inténtalo de nuevo.'
  }
  if (error.code === 'invalid_credentials' || error.status === 400) {
    return 'Correo o contraseña incorrectos.'
  }
  return 'No pudimos iniciar sesión. Revisa tu conexión e inténtalo de nuevo.'
}

function mensajeCambioClave(error: AuthError): string {
  if (error.code === 'same_password') {
    return 'La nueva contraseña debe ser distinta de la actual.'
  }
  if (error.code === 'weak_password') {
    return 'La contraseña es muy débil. Usa al menos 8 caracteres con letras y números.'
  }
  return 'No pudimos cambiar la contraseña. Inténtalo de nuevo.'
}

/** Devuelve un mensaje de error, o null si todo salió bien. */
export async function iniciarSesionConClave(correo: string, clave: string): Promise<string | null> {
  const { error } = await obtenerClienteSupabase().auth.signInWithPassword({
    email: correo.trim(),
    password: clave,
  })
  return error ? mensajeInicioSesion(error) : null
}

export async function cerrarSesionActual(): Promise<void> {
  await obtenerClienteSupabase().auth.signOut()
}

/** Cambia la contraseña y marca el perfil como "ya la cambió". Devuelve un mensaje de error o null. */
export async function actualizarClave(nueva: string): Promise<string | null> {
  const supabase = obtenerClienteSupabase()
  const { error } = await supabase.auth.updateUser({ password: nueva })
  if (error) return mensajeCambioClave(error)

  const { error: errorMarca } = await supabase.rpc('marcar_clave_cambiada')
  if (errorMarca) {
    return 'La contraseña se cambió, pero no pudimos terminar el proceso. Inténtalo de nuevo.'
  }
  return null
}

export async function consultarPerfil(
  id: string,
): Promise<{ perfil: Perfil | null; fallo: boolean }> {
  const { data, error } = await obtenerClienteSupabase()
    .from('perfiles')
    .select('id, rol, nombre_completo, correo, activo, debe_cambiar_clave')
    .eq('id', id)
    .maybeSingle()
  if (error) return { perfil: null, fallo: true }
  return { perfil: (data as Perfil | null) ?? null, fallo: false }
}
