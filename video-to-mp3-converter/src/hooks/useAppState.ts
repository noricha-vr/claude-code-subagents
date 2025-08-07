import { useState, useCallback, useMemo } from 'react'

export interface ConversionState {
  isConverting: boolean
  progress: number
  currentFile: File | null
  error: string | null
  convertedFileUrl: string | null
}

export interface AppState {
  environment: {
    crossOriginIsolated: boolean | null
    sharedArrayBufferSupported: boolean | null
    isReady: boolean
  }
  conversion: ConversionState
  ui: {
    isDarkMode: boolean
    showDebugInfo: boolean
  }
}

export interface AppActions {
  // Environment actions
  setEnvironmentStatus: (status: Partial<AppState['environment']>) => void
  
  // Conversion actions
  setCurrentFile: (file: File | null) => void
  setConversionProgress: (progress: number) => void
  setConversionError: (error: string | null) => void
  setConvertedFileUrl: (url: string | null) => void
  startConversion: () => void
  resetConversion: () => void
  
  // Error handling actions
  setError: (error: string) => void
  clearError: () => void
  
  // UI actions
  toggleDarkMode: () => void
  toggleDebugInfo: () => void
}

const initialState: AppState = {
  environment: {
    crossOriginIsolated: null,
    sharedArrayBufferSupported: null,
    isReady: false
  },
  conversion: {
    isConverting: false,
    progress: 0,
    currentFile: null,
    error: null,
    convertedFileUrl: null
  },
  ui: {
    isDarkMode: false,
    showDebugInfo: process.env.NODE_ENV === 'development'
  }
}

export const useAppState = () => {
  const [state, setState] = useState<AppState>(initialState)

  // Environment actions
  const setEnvironmentStatus = useCallback((status: Partial<AppState['environment']>) => {
    setState(prev => ({
      ...prev,
      environment: {
        ...prev.environment,
        ...status,
        isReady: (status.crossOriginIsolated ?? prev.environment.crossOriginIsolated) === true &&
                (status.sharedArrayBufferSupported ?? prev.environment.sharedArrayBufferSupported) === true
      }
    }))
  }, [])

  // Conversion actions
  const setCurrentFile = useCallback((file: File | null) => {
    setState(prev => ({
      ...prev,
      conversion: {
        ...prev.conversion,
        currentFile: file,
        error: null,
        convertedFileUrl: null,
        progress: 0
      }
    }))
  }, [])

  const setConversionProgress = useCallback((progress: number) => {
    setState(prev => ({
      ...prev,
      conversion: {
        ...prev.conversion,
        progress: Math.max(0, Math.min(100, progress))
      }
    }))
  }, [])

  const setConversionError = useCallback((error: string | null) => {
    setState(prev => ({
      ...prev,
      conversion: {
        ...prev.conversion,
        error,
        isConverting: false
      }
    }))
  }, [])

  const setConvertedFileUrl = useCallback((url: string | null) => {
    setState(prev => ({
      ...prev,
      conversion: {
        ...prev.conversion,
        convertedFileUrl: url,
        isConverting: false,
        progress: url ? 100 : prev.conversion.progress
      }
    }))
  }, [])

  const startConversion = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversion: {
        ...prev.conversion,
        isConverting: true,
        progress: 0,
        error: null,
        convertedFileUrl: null
      }
    }))
  }, [])

  const resetConversion = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversion: {
        isConverting: false,
        progress: 0,
        currentFile: null,
        error: null,
        convertedFileUrl: null
      }
    }))
  }, [])

  // UI actions
  const toggleDarkMode = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        isDarkMode: !prev.ui.isDarkMode
      }
    }))
  }, [])

  const toggleDebugInfo = useCallback(() => {
    setState(prev => ({
      ...prev,
      ui: {
        ...prev.ui,
        showDebugInfo: !prev.ui.showDebugInfo
      }
    }))
  }, [])

  // Error handling actions
  const setError = useCallback((error: string) => {
    setState(prev => ({
      ...prev,
      conversion: {
        ...prev.conversion,
        error
      }
    }))
  }, [])

  const clearError = useCallback(() => {
    setState(prev => ({
      ...prev,
      conversion: {
        ...prev.conversion,
        error: null
      }
    }))
  }, [])

  // Computed values
  const computedValues = useMemo(() => ({
    canStartConversion: state.environment.isReady && 
                       state.conversion.currentFile !== null && 
                       !state.conversion.isConverting,
    hasActiveConversion: state.conversion.isConverting || state.conversion.progress > 0,
    conversionComplete: state.conversion.convertedFileUrl !== null
  }), [
    state.environment.isReady,
    state.conversion.currentFile,
    state.conversion.isConverting,
    state.conversion.progress,
    state.conversion.convertedFileUrl
  ])

  const actions: AppActions = {
    setEnvironmentStatus,
    setCurrentFile,
    setConversionProgress,
    setConversionError,
    setConvertedFileUrl,
    startConversion,
    resetConversion,
    setError,
    clearError,
    toggleDarkMode,
    toggleDebugInfo
  }

  return {
    state,
    actions,
    computed: computedValues
  }
}

export type UseAppStateReturn = ReturnType<typeof useAppState>