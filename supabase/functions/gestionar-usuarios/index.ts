// Función de servidor: gestionar-usuarios
// Solo la administradora puede usarla. Acciones:
//   crear              -> crea el acceso (usuario + perfil), el empleado y su primera tarifa
//   restablecer_clave  -> genera una contraseña temporal nueva
//   cambiar_correo     -> cambia el correo de acceso de un empleado
// Usa la clave secreta del servidor, que NUNCA debe llegar al navegador.

import { createClient, type SupabaseClient } from 'npm:@supabase/supabase-js@2'

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

const MODALIDADES = ['por_hora', 'quincena_fija', 'por_grupo']

function responder(estado: number, cuerpo: unknown): Response {
  return new Response(JSON.stringify(cuerpo), {
    status: estado,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  })
}

// Lee la clave nueva (formato JSON con "default") y, si no existe, la clave legada.
function leerClave(variableNueva: string, variableLegada: string): string {
  const json = Deno.env.get(variableNueva)
  if (json) {
    try {
      const claves = JSON.parse(json) as Record<string, string>
      if (claves.default) return claves.default
    } catch {
      // se ignora y se usa la clave legada
    }
  }
  return Deno.env.get(variableLegada) ?? ''
}

function texto(valor: unknown): string {
  return typeof valor === 'string' ? valor.trim() : ''
}

function esCorreoValido(correo: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(correo)
}

function esFechaValida(fecha: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(fecha) && !Number.isNaN(Date.parse(fecha))
}

function aleatorio(maximo: number): number {
  const buffer = new Uint32Array(1)
  crypto.getRandomValues(buffer)
  return buffer[0] % maximo
}

// Contraseña temporal legible: 12 caracteres (letras y números sin símbolos confusos),
// en grupos de 4, por ejemplo k7Hm-x2Qp-9Tnw.
function generarClaveTemporal(): string {
  const letras = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ'
  const digitos = '23456789'
  const caracteres: string[] = []
  for (let i = 0; i < 8; i++) caracteres.push(letras[aleatorio(letras.length)])
  for (let i = 0; i < 4; i++) caracteres.push(digitos[aleatorio(digitos.length)])
  for (let i = caracteres.length - 1; i > 0; i--) {
    const j = aleatorio(i + 1)
    ;[caracteres[i], caracteres[j]] = [caracteres[j], caracteres[i]]
  }
  const clave = caracteres.join('')
  return `${clave.slice(0, 4)}-${clave.slice(4, 8)}-${clave.slice(8, 12)}`
}

function esCorreoRepetido(error: { code?: string; message: string }): boolean {
  return error.code === 'email_exists' || /already|registered/i.test(error.message)
}

async function crearEmpleado(
  admin: SupabaseClient,
  actorId: string,
  c: Record<string, unknown>,
): Promise<Response> {
  const correo = texto(c.correo).toLowerCase()
  const nombre = texto(c.nombre_completo)
  const puesto = texto(c.puesto)
  const fechaIngreso = texto(c.fecha_ingreso)
  const modalidad = texto(c.modalidad_pago)
  const tarifa = Number(c.tarifa_crc)
  const notas = texto(c.notas)

  if (!esCorreoValido(correo)) return responder(400, { error: 'Escribe un correo válido.' })
  if (!nombre) return responder(400, { error: 'Escribe el nombre completo.' })
  if (!puesto) return responder(400, { error: 'Escribe el puesto.' })
  if (!esFechaValida(fechaIngreso)) return responder(400, { error: 'Elige la fecha de ingreso.' })
  if (!MODALIDADES.includes(modalidad)) return responder(400, { error: 'Elige la modalidad de pago.' })
  if (!Number.isSafeInteger(tarifa) || tarifa <= 0) {
    return responder(400, { error: 'La tarifa debe ser un número entero mayor que cero.' })
  }

  const clave = generarClaveTemporal()

  const { data: creado, error: errorAuth } = await admin.auth.admin.createUser({
    email: correo,
    password: clave,
    email_confirm: true,
  })
  if (errorAuth || !creado.user) {
    if (errorAuth && esCorreoRepetido(errorAuth)) {
      return responder(409, { error: 'Ya existe un usuario con ese correo.' })
    }
    return responder(500, { error: 'No pudimos crear el acceso. Inténtalo de nuevo.' })
  }
  const usuarioId = creado.user.id

  // Si algo falla más adelante se borra el acceso recién creado (el resto se borra en cascada).
  async function deshacer(): Promise<void> {
    await admin.auth.admin.deleteUser(usuarioId)
  }

  const { error: errorPerfil } = await admin.from('perfiles').insert({
    id: usuarioId,
    rol: 'empleado',
    nombre_completo: nombre,
    correo,
    activo: true,
    debe_cambiar_clave: true,
  })
  if (errorPerfil) {
    await deshacer()
    return responder(500, { error: 'No pudimos guardar el perfil. Inténtalo de nuevo.' })
  }

  const { data: empleado, error: errorEmpleado } = await admin
    .from('empleados')
    .insert({
      perfil_id: usuarioId,
      puesto,
      fecha_ingreso: fechaIngreso,
      notas: notas || null,
    })
    .select('id')
    .single()
  if (errorEmpleado || !empleado) {
    await deshacer()
    return responder(500, { error: 'No pudimos guardar al empleado. Inténtalo de nuevo.' })
  }

  const { error: errorTarifa } = await admin.from('tarifas_empleado').insert({
    empleado_id: empleado.id,
    modalidad_pago: modalidad,
    tarifa_crc: tarifa,
    vigente_desde: fechaIngreso,
    creado_por: actorId,
  })
  if (errorTarifa) {
    await deshacer()
    return responder(500, { error: 'No pudimos guardar la tarifa. Inténtalo de nuevo.' })
  }

  return responder(200, { empleado_id: empleado.id, clave_temporal: clave })
}

async function buscarEmpleado(admin: SupabaseClient, perfilId: string) {
  const { data } = await admin.from('perfiles').select('id, rol, correo').eq('id', perfilId).maybeSingle()
  return data && data.rol === 'empleado' ? data : null
}

async function restablecerClave(admin: SupabaseClient, c: Record<string, unknown>): Promise<Response> {
  const perfilId = texto(c.perfil_id)
  if (!perfilId || !(await buscarEmpleado(admin, perfilId))) {
    return responder(404, { error: 'No encontramos a ese empleado.' })
  }

  const clave = generarClaveTemporal()
  const { error: errorAuth } = await admin.auth.admin.updateUserById(perfilId, { password: clave })
  if (errorAuth) return responder(500, { error: 'No pudimos restablecer la contraseña.' })

  const { error: errorPerfil } = await admin
    .from('perfiles')
    .update({ debe_cambiar_clave: true })
    .eq('id', perfilId)
  if (errorPerfil) {
    return responder(500, { error: 'La contraseña cambió, pero no pudimos exigir su cambio. Inténtalo de nuevo.' })
  }

  return responder(200, { clave_temporal: clave })
}

async function cambiarCorreo(admin: SupabaseClient, c: Record<string, unknown>): Promise<Response> {
  const perfilId = texto(c.perfil_id)
  const correo = texto(c.correo).toLowerCase()
  if (!esCorreoValido(correo)) return responder(400, { error: 'Escribe un correo válido.' })

  const actual = perfilId ? await buscarEmpleado(admin, perfilId) : null
  if (!actual) return responder(404, { error: 'No encontramos a ese empleado.' })

  const { error: errorAuth } = await admin.auth.admin.updateUserById(perfilId, {
    email: correo,
    email_confirm: true,
  })
  if (errorAuth) {
    if (esCorreoRepetido(errorAuth)) {
      return responder(409, { error: 'Ya existe un usuario con ese correo.' })
    }
    return responder(500, { error: 'No pudimos cambiar el correo.' })
  }

  const { error: errorPerfil } = await admin.from('perfiles').update({ correo }).eq('id', perfilId)
  if (errorPerfil) {
    // Se devuelve el correo anterior para que acceso y perfil no queden distintos.
    await admin.auth.admin.updateUserById(perfilId, { email: actual.correo, email_confirm: true })
    return responder(500, { error: 'No pudimos guardar el nuevo correo. Inténtalo de nuevo.' })
  }

  return responder(200, { ok: true })
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS })
  if (req.method !== 'POST') return responder(405, { error: 'Método no permitido.' })

  const url = Deno.env.get('SUPABASE_URL') ?? ''
  const clavePublica = leerClave('SUPABASE_PUBLISHABLE_KEYS', 'SUPABASE_ANON_KEY')
  const claveSecreta = leerClave('SUPABASE_SECRET_KEYS', 'SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !clavePublica || !claveSecreta) {
    return responder(500, { error: 'El servidor no está configurado.' })
  }

  // 1) Quién llama: la sesión debe ser válida...
  const cabecera = req.headers.get('Authorization') ?? ''
  const token = cabecera.replace(/^Bearer\s+/i, '')
  if (!token) return responder(401, { error: 'Debes iniciar sesión.' })

  const clienteUsuario = createClient(url, clavePublica, {
    global: { headers: { Authorization: cabecera } },
    auth: { persistSession: false, autoRefreshToken: false },
  })
  const { data: datosUsuario, error: errorUsuario } = await clienteUsuario.auth.getUser(token)
  if (errorUsuario || !datosUsuario.user) {
    return responder(401, { error: 'Tu sesión no es válida. Vuelve a ingresar.' })
  }

  // 2) ...y debe ser una administradora activa.
  const { data: esAdmin, error: errorAdmin } = await clienteUsuario.rpc('es_admin')
  if (errorAdmin || esAdmin !== true) {
    return responder(403, { error: 'Solo la administradora puede hacer esto.' })
  }

  let cuerpo: Record<string, unknown>
  try {
    cuerpo = await req.json()
  } catch {
    return responder(400, { error: 'Solicitud inválida.' })
  }

  const admin = createClient(url, claveSecreta, {
    auth: { persistSession: false, autoRefreshToken: false },
  })

  try {
    switch (cuerpo.accion) {
      case 'crear':
        return await crearEmpleado(admin, datosUsuario.user.id, cuerpo)
      case 'restablecer_clave':
        return await restablecerClave(admin, cuerpo)
      case 'cambiar_correo':
        return await cambiarCorreo(admin, cuerpo)
      default:
        return responder(400, { error: 'Acción desconocida.' })
    }
  } catch {
    return responder(500, { error: 'Ocurrió un error inesperado. Inténtalo de nuevo.' })
  }
})
