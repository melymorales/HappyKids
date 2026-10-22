/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_CLAVE_PUBLICA?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
