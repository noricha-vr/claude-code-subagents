import React, { createContext, useContext } from 'react';
import type { ReactNode } from 'react';
import { usePWA, usePWAInstall } from '../hooks/usePWA';
import type { UsePWAReturn } from '../hooks/usePWA';
import PWAInstallPrompt from './PWAInstallPrompt';
import PWAUpdatePrompt from './PWAUpdatePrompt';
import OfflineIndicator from './OfflineIndicator';

interface PWAInstallContext {
  canInstall: boolean;
  isInstalling: boolean;
  installError: string | null;
  installPWA: () => Promise<void>;
}

interface PWAContextType extends UsePWAReturn {
  install: PWAInstallContext;
}

const PWAContext = createContext<PWAContextType | undefined>(undefined);

export const usePWAContext = (): PWAContextType => {
  const context = useContext(PWAContext);
  if (!context) {
    throw new Error('usePWAContext must be used within PWAProvider');
  }
  return context;
};

interface PWAProviderProps {
  children: ReactNode;
  showInstallPrompt?: boolean;
  showUpdatePrompt?: boolean;
  showOfflineIndicator?: boolean;
  onInstall?: () => void;
  onUpdate?: () => void;
}

export const PWAProvider: React.FC<PWAProviderProps> = ({
  children,
  showInstallPrompt = true,
  showUpdatePrompt = true,
  showOfflineIndicator = true,
  onInstall,
  onUpdate,
}) => {
  const pwaState = usePWA();
  const installState = usePWAInstall();

  const contextValue: PWAContextType = {
    ...pwaState,
    install: installState,
  };

  return (
    <PWAContext.Provider value={contextValue}>
      {children}
      
      {/* PWA Install Prompt */}
      {showInstallPrompt && !pwaState.isInstalled && (
        <PWAInstallPrompt 
          onInstall={onInstall}
          onDismiss={() => console.log('Install prompt dismissed')}
        />
      )}

      {/* PWA Update Prompt */}
      {showUpdatePrompt && (
        <PWAUpdatePrompt 
          onUpdate={onUpdate}
          onDismiss={() => console.log('Update prompt dismissed')}
        />
      )}

      {/* Offline Indicator */}
      {showOfflineIndicator && (
        <OfflineIndicator showWhenOnline={true} />
      )}
    </PWAContext.Provider>
  );
};

export default PWAProvider;