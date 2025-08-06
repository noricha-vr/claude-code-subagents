import React, { useState, useEffect } from 'react'
import { PWAManager } from '../utils/pwaUtils'

const PWAInstallButton: React.FC = () => {
  const [pwaManager] = useState(() => new PWAManager())
  const [canInstall, setCanInstall] = useState(false)
  const [isInstalled, setIsInstalled] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)

  useEffect(() => {
    // Check initial state
    setCanInstall(pwaManager.canInstall())
    setIsInstalled(pwaManager.isAppInstalled())

    // Set up event listeners
    pwaManager.onInstallPromptAvailable(setCanInstall)
    pwaManager.onInstalled(() => {
      setIsInstalled(true)
      setCanInstall(false)
      setIsInstalling(false)
    })
  }, [pwaManager])

  const handleInstall = async () => {
    if (!canInstall || isInstalling) return

    setIsInstalling(true)
    try {
      const success = await pwaManager.install()
      if (success) {
        console.log('PWA installation successful')
      } else {
        console.log('PWA installation cancelled by user')
      }
    } catch (error) {
      console.error('PWA installation error:', error)
    } finally {
      setIsInstalling(false)
    }
  }

  // Don't show button if already installed or can't install
  if (isInstalled || !canInstall) {
    return null
  }

  return (
    <button
      onClick={handleInstall}
      disabled={isInstalling}
      className="inline-flex items-center px-4 py-2 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white text-sm font-medium rounded-lg transition-colors duration-200 disabled:cursor-not-allowed"
      title="アプリをデバイスにインストール"
    >
      {isInstalling ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          インストール中...
        </>
      ) : (
        <>
          <svg
            className="w-4 h-4 mr-2"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z"
            />
          </svg>
          アプリをインストール
        </>
      )}
    </button>
  )
}

export default PWAInstallButton