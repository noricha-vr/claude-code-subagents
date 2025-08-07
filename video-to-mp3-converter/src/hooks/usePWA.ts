import { useState, useEffect, useCallback } from 'react';

interface PWAUpdateInfo {
  isUpdateAvailable: boolean;
  updateSW: () => Promise<void>;
  registrationError: string | null;
}

interface PWAStatus {
  isInstalled: boolean;
  isOnline: boolean;
  isUpdateAvailable: boolean;
  registration: ServiceWorkerRegistration | null;
  error: string | null;
}

interface PWAActions {
  checkForUpdate: () => Promise<void>;
  forceUpdate: () => Promise<void>;
  unregister: () => Promise<boolean>;
}

export interface UsePWAReturn extends PWAStatus, PWAActions {
  updateInfo: PWAUpdateInfo;
}

export const usePWA = (): UsePWAReturn => {
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [registration, setRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [waitingWorker, setWaitingWorker] = useState<ServiceWorker | null>(null);

  // Check if app is installed
  useEffect(() => {
    const checkInstallStatus = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    checkInstallStatus();
    
    // Listen for display mode changes
    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', checkInstallStatus);
    
    return () => mediaQuery.removeEventListener('change', checkInstallStatus);
  }, []);

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Service Worker registration and update handling
  useEffect(() => {
    if ('serviceWorker' in navigator) {
      const initServiceWorker = async () => {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (reg) {
            setRegistration(reg);

            // Check for waiting worker
            if (reg.waiting) {
              setWaitingWorker(reg.waiting);
              setIsUpdateAvailable(true);
            }

            // Listen for update found
            reg.addEventListener('updatefound', () => {
              const newWorker = reg.installing;
              if (newWorker) {
                newWorker.addEventListener('statechange', () => {
                  if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                    setWaitingWorker(newWorker);
                    setIsUpdateAvailable(true);
                  }
                });
              }
            });

            // Listen for controller change
            navigator.serviceWorker.addEventListener('controllerchange', () => {
              window.location.reload();
            });
          }
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Unknown service worker error';
          setError(message);
          console.error('Service Worker initialization failed:', err);
        }
      };

      initServiceWorker();
    } else {
      setError('Service Worker not supported in this browser');
    }
  }, []);

  // Check for updates
  const checkForUpdate = useCallback(async () => {
    if (!registration) return;

    try {
      await registration.update();
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Update check failed';
      setError(message);
      console.error('Service Worker update check failed:', err);
    }
  }, [registration]);

  // Force update by activating waiting worker
  const forceUpdate = useCallback(async () => {
    if (!waitingWorker) return;

    waitingWorker.postMessage({ type: 'SKIP_WAITING' });
    setIsUpdateAvailable(false);
    setWaitingWorker(null);
  }, [waitingWorker]);

  // Unregister service worker
  const unregister = useCallback(async (): Promise<boolean> => {
    if (!registration) return false;

    try {
      const result = await registration.unregister();
      if (result) {
        setRegistration(null);
        setIsUpdateAvailable(false);
        setWaitingWorker(null);
        setError(null);
      }
      return result;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unregistration failed';
      setError(message);
      console.error('Service Worker unregistration failed:', err);
      return false;
    }
  }, [registration]);

  // Update SW function for vite-plugin-pwa compatibility
  const updateSW = useCallback(async () => {
    await forceUpdate();
  }, [forceUpdate]);

  return {
    // Status
    isInstalled,
    isOnline,
    isUpdateAvailable,
    registration,
    error,

    // Actions
    checkForUpdate,
    forceUpdate,
    unregister,

    // Update info for vite-plugin-pwa compatibility
    updateInfo: {
      isUpdateAvailable,
      updateSW,
      registrationError: error,
    },
  };
};

// PWA installation hook
export const usePWAInstall = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [installError, setInstallError] = useState<string | null>(null);

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setCanInstall(true);
    };

    const handleAppInstalled = () => {
      setCanInstall(false);
      (window as any).deferredPrompt = null;
      console.log('PWA was installed');
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const installPWA = useCallback(async () => {
    const windowDeferredPrompt = (window as any).deferredPrompt;
    if (!windowDeferredPrompt) {
      setInstallError('Installation not available');
      return;
    }

    setIsInstalling(true);
    setInstallError(null);

    try {
      await windowDeferredPrompt.prompt();
      const choiceResult = await windowDeferredPrompt.userChoice;
      
      if (choiceResult.outcome === 'accepted') {
        console.log('User accepted the install prompt');
        setCanInstall(false);
      } else {
        console.log('User dismissed the install prompt');
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Installation failed';
      setInstallError(message);
      console.error('PWA installation failed:', error);
    } finally {
      setIsInstalling(false);
      (window as any).deferredPrompt = null;
    }
  }, []);

  return {
    canInstall,
    isInstalling,
    installError,
    installPWA,
  };
};

export default usePWA;