# Happy Kids: sistema de administración

Sistema web para administrar el kínder Happy Kids: empleados, asistencia, nómina, clientes, cobros y permisos.

**Tecnologías:** React + TypeScript + Vite, Tailwind CSS, Supabase (PostgreSQL, Auth, RLS) y Cloudflare (publicación).

## Requisitos

- Node.js 20 o superior
- Un proyecto de Supabase (ya creado)

## Ejecutar en tu computadora

```bash
npm install
cp .env.example .env.local   # luego completa los valores
npm run dev
```

Variables (Supabase > Project Settings > API):

| Variable | Qué es |
|---|---|
| `VITE_SUPABASE_URL` | Dirección del proyecto |
| `VITE_SUPABASE_CLAVE_PUBLICA` | Clave pública (anon / publishable) |

**Nunca** pongas la clave `service_role` en variables que empiecen con `VITE_`: quedan visibles en el navegador.

## Publicar en Cloudflare

El repositorio ya trae `wrangler.jsonc` (archivos estáticos de `dist/` con soporte para rutas de aplicación de una sola página).

1. En Cloudflare: Workers & Pages > Create > importar el repositorio de GitHub (los nombres de los menús pueden variar).
2. Comando de compilación: `npm run build`. Comando de despliegue: `npx wrangler deploy`.
3. El nombre del proyecto en Cloudflare debe ser `happy-kids` (igual al campo `name` de `wrangler.jsonc`).
4. Agrega las dos variables `VITE_...` como variables de compilación (build). Sin ellas la página publica, pero sin conexión a Supabase.
5. Cada cambio que se suba a la rama principal se publica solo.

## Estructura

```
supabase/        migraciones, funciones y datos iniciales (nombres fijos de Supabase)
.github/         tareas automáticas (mantener activo y respaldo semanal)
src/
  aplicacion/    rutas, páginas y layouts por rol
  nucleo/        configuración, cliente de Supabase, sesión
  compartido/    componentes, utilidades y hooks compartidos
  estilos/       estilos globales
  funcionalidades/  una carpeta por funcionalidad (ver LEEME.md)
```

## Convenciones

- Nombres en español sin tildes ni ñ: carpetas en minúsculas, componentes en PascalCase (`FormularioEmpleado`), utilidades en camelCase (`formatoColones.ts`).
- Los hooks conservan el prefijo `use` (`useEmpleados`).
- Lo que fijan las herramientas no se traduce: `supabase/migrations`, `supabase/functions`, `.github/workflows`, `src`.
- Las fórmulas de nómina y horas viven en la base de datos, no en las pantallas.
- Colores y tipografías vienen de `tailwind.config.js` (guía de marca aprobada): `bg-pastel-lavanda`, `text-tinta`, `font-titulo`.
