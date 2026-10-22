# Funcionalidades

Una carpeta por funcionalidad. Todo lo de cada una vive dentro de su carpeta:

- `administradora/` y `empleado/`: pantallas de cada rol.
- `consultas/`: acceso a Supabase (las pantallas no hablan directo con la base de datos).
- `ganchos/`: hooks (`useNombre`, el prefijo `use` lo exige React).
- `componentes/`: piezas visuales propias de la funcionalidad.
- `esquemas/`: validaciones con Zod.
- `tipos.ts`: tipos de TypeScript (se crea cuando haga falta).

Una funcionalidad no importa código de otra. Lo compartido va en `src/compartido/` o `src/nucleo/`.
