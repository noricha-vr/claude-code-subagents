import { useState, Suspense, lazy } from 'react'
import { AppContextProvider } from './context/AppContext'
import ErrorBoundary from './components/ErrorBoundary'
import MainLayout from './components/Layout'
import GlobalToastProvider from './components/GlobalToastProvider'
import PWAProvider from './components/PWAProvider'

// Lazy load components for code splitting
const HomePage = lazy(() => import('./pages/HomePage'))
const Converter = lazy(() => import('./pages/Converter'))

function App() {
  const isDevelopment = process.env.NODE_ENV === 'development'
  const [currentPage, setCurrentPage] = useState<'home' | 'converter'>('home')
  
  const handlePWAInstall = () => {
    console.log('PWA installed successfully')
  }

  const handlePWAUpdate = () => {
    console.log('PWA updated successfully')
    // Optionally show a toast notification
    window.location.reload()
  }
  
  const handleNavigateToConverter = () => {
    setCurrentPage('converter')
  }
  
  const handleNavigateToHome = () => {
    setCurrentPage('home')
  }
  
  return (
    <ErrorBoundary>
      <PWAProvider 
        onInstall={handlePWAInstall}
        onUpdate={handlePWAUpdate}
        showInstallPrompt={!isDevelopment} // Hide install prompt in development
        showUpdatePrompt={true}
        showOfflineIndicator={true}
      >
        <AppContextProvider>
          <MainLayout
            currentPage={currentPage}
            onNavigateToHome={handleNavigateToHome}
            onNavigateToConverter={handleNavigateToConverter}
          >
            <Suspense 
              fallback={
                <div className="flex items-center justify-center min-h-64">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
              }
            >
              {currentPage === 'home' ? (
                <HomePage 
                  onNavigateToConverter={handleNavigateToConverter}
                  showDemoFeatures={isDevelopment} 
                />
              ) : (
                <Converter />
              )}
            </Suspense>
          </MainLayout>
          <GlobalToastProvider />
        </AppContextProvider>
      </PWAProvider>
    </ErrorBoundary>
  )
}

export default App
