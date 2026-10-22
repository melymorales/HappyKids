/** Reglas de la contraseña nueva. Devuelve un mensaje de error, o null si es válida. */
export function validarNuevaClave(nueva: string, confirmacion: string): string | null {
  if (nueva.length < 8) return 'La contraseña debe tener al menos 8 caracteres.'
  if (!/[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]/.test(nueva) || !/\d/.test(nueva)) {
    return 'La contraseña debe combinar letras y números.'
  }
  if (nueva !== confirmacion) return 'Las contraseñas no coinciden.'
  return null
}
