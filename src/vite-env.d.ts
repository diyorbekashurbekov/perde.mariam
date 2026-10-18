/// <reference types="vite/client" />

interface ImportMetaEnv {
  // GitHub → Settings → Secrets and variables → Actions → Variables: GA4_ID (мысалы, G-XXXXXXXXXX)
  readonly VITE_GA4_ID?: string
  // GitHub Variables: META_PIXEL_ID (тек сандар)
  readonly VITE_META_PIXEL_ID?: string
  // GitHub Variables: GOOGLE_CLIENT_ID — админ панельге Google арқылы кіру үшін (Google Cloud → OAuth client, құпия емес)
  readonly VITE_GOOGLE_CLIENT_ID?: string
}
