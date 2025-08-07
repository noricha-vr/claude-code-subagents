/// <reference types="vite/client" />

// Global type extensions
interface Window {
  crossOriginIsolated: boolean
  // PWA related
  deferredPrompt?: any;
}

// Environment variables
interface ImportMetaEnv {
  readonly VITE_APP_TITLE: string
  readonly VITE_DEBUG_MODE: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

// Service Worker and PWA types
declare global {
  // Service Worker global scope
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST: any;
  }
}

export {};
