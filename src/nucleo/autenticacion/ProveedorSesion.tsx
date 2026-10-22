import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { User } from '@supabase/supabase-js'
import { ContextoSesion, type ValorSesion } from '@/nucleo/autenticacion/contextoSesion'
import {
  actualizarClave,
  cerrarSesionActual,
  consultarPerfil,
  iniciarSesionConClave,
} from '@/nucleo/autenticacion/servicioAutenticacion'
import type { Perfil } from '@/nucleo/autenticacion/tipos'
import { entorno } from '@/nucleo/configuracion/entorno'
import { obtenerClienteSupabase } from '@/nucleo/supabase/clienteSupabase'

interface Props {
  children: ReactNode
}

export function ProveedorSesion({ children }: Props) {
  const [usuario, setUsuario] = useState<User | null>(null)
  const [perfil, setPerfil] = useState<Perfil | null>(null)
  const [cargandoSesion, setCargandoSesion] = useState(entorno.supabaseConfigurado)
  const [errorAcceso, setErrorAcceso] = useState<string | null>(null)

  // 1) Sesión de Supabase: se lee al abrir y se mantiene al día.
  useEffect(() => {
    if (!entorno.supabaseConfigurado) return
    const supabase = obtenerClienteSupabase()

    void supabase.auth.getSession().then(({ data }) => {
      setUsuario(data.session?.user ?? null)
      setCargandoSesion(false)
    })

    // No se hacen consultas a Supabase dentro de este callback (puede bloquearse).
    const { data: suscripcion } = supabase.auth.onAuthStateChange((_evento, sesion) => {
      setUsuario(sesion?.user ?? null)
    })
    return () => suscripcion.subscription.unsubscribe()
  }, [])

  // 2) Perfil (rol, estado): se carga cuando cambia la persona, no en cada renovación del token.
  const idUsuario = usuario?.id ?? null
  useEffect(() => {
    if (!idUsuario) {
      setPerfil(null)
      return
    }
    let cancelado = false
    void consultarPerfil(idUsuario).then(async (resultado) => {
      if (cancelado) return
      if (resultado.fallo) {
        setErrorAcceso('No pudimos cargar tu perfil. Inténtalo de nuevo.')
        await cerrarSesionActual()
        return
      }
      if (!resultado.perfil || !resultado.perfil.activo) {
        setErrorAcceso('Tu cuenta no está activa. Habla con la administradora.')
        await cerrarSesionActual()
        return
      }
      setPerfil(resultado.perfil)
    })
    return () => {
      cancelado = true
    }
  }, [idUsuario])

  const iniciarSesion = useCallback(async (correo: string, clave: string) => {
    setErrorAcceso(null)
    return iniciarSesionConClave(correo, clave)
  }, [])

  const cerrarSesion = useCallback(async () => {
    await cerrarSesionActual()
    setPerfil(null)
  }, [])

  const cambiarClave = useCallback(async (nueva: string) => {
    const mensaje = await actualizarClave(nueva)
    if (mensaje === null) {
      setPerfil((actual) => (actual ? { ...actual, debe_cambiar_clave: false } : actual))
    }
    return mensaje
  }, [])

  // Hay sesión pero el perfil aún no llega: sigue "cargando".
  const cargando = cargandoSesion || (usuario !== null && perfil === null && errorAcceso === null)

  const valor = useMemo<ValorSesion>(
    () => ({ usuario, perfil, cargando, errorAcceso, iniciarSesion, cerrarSesion, cambiarClave }),
    [usuario, perfil, cargando, errorAcceso, iniciarSesion, cerrarSesion, cambiarClave],
  )

  return <ContextoSesion.Provider value={valor}>{children}</ContextoSesion.Provider>
}
