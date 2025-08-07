import { createContext, useContext, useEffect } from 'react'
import type { ReactNode } from 'react'
import { useAppState, type UseAppStateReturn } from '../hooks/useAppState'
import { useGlobalErrorHandler } from '../hooks/useGlobalErrorHandler'

interface AppContextProviderProps {
  children: ReactNode
}

interface AppContextValue extends UseAppStateReturn {
  errorHandler: ReturnType<typeof useGlobalErrorHandler>;
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

export const useApp = () => {
  const context = useContext(AppContext)
  if (context === undefined) {
    throw new Error('useApp must be used within an AppContextProvider')
  }
  return context
}

export const AppContextProvider = ({ children }: AppContextProviderProps) => {
  const appState = useAppState()
  const errorHandler = useGlobalErrorHandler()

  // Initialize environment checks on mount
  useEffect(() => {
    const checkEnvironment = () => {
      const crossOriginIsolated = typeof window !== 'undefined' && window.crossOriginIsolated
      const sharedArrayBufferSupported = typeof SharedArrayBuffer !== 'undefined'
      
      appState.actions.setEnvironmentStatus({
        crossOriginIsolated,
        sharedArrayBufferSupported
      })
    }

    checkEnvironment()
  }, [])

  // Handle dark mode based on system preference
  useEffect(() => {
    const handleSystemThemeChange = (_e: MediaQueryListEvent) => {
      // Only auto-toggle if user hasn't manually set a preference
      // In a full implementation, you'd check localStorage here
      if (!localStorage.getItem('user-theme-preference')) {
        // Auto-toggle based on system preference (optional)
        // appState.actions.toggleDarkMode()
      }
    }

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)')
    mediaQuery.addEventListener('change', handleSystemThemeChange)

    // Set initial theme based on system preference
    if (mediaQuery.matches && !appState.state.ui.isDarkMode) {
      // Uncomment if you want to auto-set dark mode based on system preference
      // appState.actions.toggleDarkMode()
    }

    return () => {
      mediaQuery.removeEventListener('change', handleSystemThemeChange)
    }
  }, [])

  // Apply dark mode class to document
  useEffect(() => {
    if (appState.state.ui.isDarkMode) {
      document.documentElement.classList.add('dark')
    } else {
      document.documentElement.classList.remove('dark')
    }
  }, [appState.state.ui.isDarkMode])

  // Global error handling is now handled by useGlobalErrorHandler
  // Remove the old manual error handling as it's now integrated

  return (
    <AppContext.Provider value={{ ...appState, errorHandler }}>
      {children}
    </AppContext.Provider>
  )
}

export default AppContext