import { useContext } from 'react'
import { ContextoSesion, type ValorSesion } from '@/nucleo/autenticacion/contextoSesion'

export function useSesion(): ValorSesion {
  const valor = useContext(ContextoSesion)
  if (!valor) {
    throw new Error('useSesion debe usarse dentro de ProveedorSesion.')
  }
  return valor
}
