export interface PWAInstallPrompt {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[]
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export class PWAManager {
  private installPrompt: BeforeInstallPromptEvent | null = null
  private isInstalled = false
  private callbacks: {
    onInstallPrompt?: (canInstall: boolean) => void
    onInstalled?: () => void
    onUpdateAvailable?: () => void
  } = {}

  constructor() {
    this.setupEventListeners()
    this.checkIfInstalled()
  }

  private setupEventListeners() {
    // Listen for install prompt
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault()
      this.installPrompt = e as BeforeInstallPromptEvent
      this.callbacks.onInstallPrompt?.(true)
      console.log('PWA install prompt available')
    })

    // Listen for successful installation
    window.addEventListener('appinstalled', () => {
      this.isInstalled = true
      this.installPrompt = null
      this.callbacks.onInstalled?.()
      console.log('PWA installed successfully')
    })

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        this.callbacks.onUpdateAvailable?.()
        console.log('Service Worker updated')
      })
    }
  }

  private checkIfInstalled() {
    // Check if running as standalone app
    this.isInstalled = window.matchMedia('(display-mode: standalone)').matches ||
                      window.matchMedia('(display-mode: fullscreen)').matches ||
                      (window.navigator as any).standalone === true

    if (this.isInstalled) {
      console.log('PWA is running as installed app')
    }
  }

  onInstallPromptAvailable(callback: (canInstall: boolean) => void) {
    this.callbacks.onInstallPrompt = callback
    // Immediately call if prompt is already available
    if (this.installPrompt) {
      callback(true)
    }
  }

  onInstalled(callback: () => void) {
    this.callbacks.onInstalled = callback
    // Immediately call if already installed
    if (this.isInstalled) {
      callback()
    }
  }

  onUpdateAvailable(callback: () => void) {
    this.callbacks.onUpdateAvailable = callback
  }

  async install(): Promise<boolean> {
    if (!this.installPrompt) {
      console.warn('No install prompt available')
      return false
    }

    try {
      await this.installPrompt.prompt()
      const result = await this.installPrompt.userChoice
      
      if (result.outcome === 'accepted') {
        console.log('User accepted PWA installation')
        return true
      } else {
        console.log('User dismissed PWA installation')
        return false
      }
    } catch (error) {
      console.error('Error during PWA installation:', error)
      return false
    }
  }

  canInstall(): boolean {
    return this.installPrompt !== null && !this.isInstalled
  }

  isAppInstalled(): boolean {
    return this.isInstalled
  }

  getInstallPrompt(): BeforeInstallPromptEvent | null {
    return this.installPrompt
  }
}

// Service Worker utilities
export const registerServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    console.warn('Service Workers not supported')
    return
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/'
    })

    console.log('Service Worker registered successfully:', registration)

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('New Service Worker available')
            // Notify user about update
          }
        })
      }
    })

  } catch (error) {
    console.error('Service Worker registration failed:', error)
  }
}

export const unregisterServiceWorker = async (): Promise<boolean> => {
  if (!('serviceWorker' in navigator)) {
    return false
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      const unregistered = await registration.unregister()
      console.log('Service Worker unregistered:', unregistered)
      return unregistered
    }
    return false
  } catch (error) {
    console.error('Service Worker unregistration failed:', error)
    return false
  }
}

export const updateServiceWorker = async (): Promise<void> => {
  if (!('serviceWorker' in navigator)) {
    return
  }

  try {
    const registration = await navigator.serviceWorker.getRegistration()
    if (registration) {
      await registration.update()
      console.log('Service Worker update check completed')
    }
  } catch (error) {
    console.error('Service Worker update failed:', error)
  }
}

// Notification utilities
export const requestNotificationPermission = async (): Promise<NotificationPermission> => {
  if (!('Notification' in window)) {
    console.warn('Notifications not supported')
    return 'denied'
  }

  if (Notification.permission === 'granted') {
    return 'granted'
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    console.log('Notification permission:', permission)
    return permission
  }

  return Notification.permission
}

export const showNotification = (
  title: string,
  options?: NotificationOptions
): Notification | null => {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    console.warn('Notifications not available or not permitted')
    return null
  }

  const notification = new Notification(title, {
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: 'video-converter',
    ...options
  })

  return notification
}

// Network status utilities
export const getNetworkStatus = (): { online: boolean; type?: string; downlink?: number } => {
  const connection = (navigator as any).connection || 
                    (navigator as any).mozConnection || 
                    (navigator as any).webkitConnection

  return {
    online: navigator.onLine,
    type: connection?.effectiveType || 'unknown',
    downlink: connection?.downlink || 0
  }
}

export const onNetworkChange = (callback: (online: boolean) => void): () => void => {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Return cleanup function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}