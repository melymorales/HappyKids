interface ErrorBase {
  message: string
  code?: string
}

/** Los mensajes que escribimos en la base de datos (código P0001) ya están en español. */
export function mensajeDeError(error: ErrorBase, porDefecto: string): string {
  if (error.code === 'P0001') return error.message
  if (error.code === '42501') return 'No tienes permiso para hacer esto.'
  return porDefecto
}
