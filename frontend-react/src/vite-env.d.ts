/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_GATEWAY_URL: string
  readonly VITE_EDITOR_WS_URL: string
  readonly VITE_EDITOR_API_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
