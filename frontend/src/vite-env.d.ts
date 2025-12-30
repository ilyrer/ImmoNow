/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_API_URL: string
  readonly VITE_DEBUG: string
  readonly VITE_ENABLE_QUERY_DEVTOOLS: string
  readonly VITE_USE_MOCK_DATA: string
  readonly VITE_ENABLE_COMMUNICATIONS: string
  readonly VITE_ENABLE_SOCIAL_HUB: string
  readonly VITE_ENABLE_FINANCE_CALCULATOR: string
  readonly VITE_ENABLE_AVM: string
  readonly VITE_ENABLE_INVESTOR_DASHBOARD: string
  readonly VITE_GOOGLE_ANALYTICS_ID: string
  readonly VITE_HOTJAR_ID: string
  readonly VITE_SENTRY_DSN: string
  readonly VITE_MAX_FILE_SIZE: string
  readonly VITE_ALLOWED_FILE_TYPES: string
  readonly VITE_DEFAULT_PAGE_SIZE: string
  readonly VITE_MAX_PAGE_SIZE: string
  readonly VITE_CACHE_STALE_TIME: string
  readonly VITE_CACHE_GC_TIME: string
  // Legacy support
  readonly REACT_APP_API_URL?: string
  readonly REACT_APP_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

