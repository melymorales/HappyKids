import { createContext } from 'react'
import type { User } from '@supabase/supabase-js'
import type { Perfil } from '@/nucleo/autenticacion/tipos'

export interface ValorSesion {
  usuario: User | null
  perfil: Perfil | null
  cargando: boolean
  /** Mensaje cuando una cuenta no puede entrar (inactiva o sin perfil). */
  errorAcceso: string | null
  /** Devuelve un mensaje de error, o null si salió bien. */
  iniciarSesion: (correo: string, clave: string) => Promise<string | null>
  cerrarSesion: () => Promise<void>
  /** Devuelve un mensaje de error, o null si salió bien. */
  cambiarClave: (nueva: string) => Promise<string | null>
}

export const ContextoSesion = createContext<ValorSesion | null>(null)
