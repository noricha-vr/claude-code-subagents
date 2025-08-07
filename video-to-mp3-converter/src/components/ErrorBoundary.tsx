import { Component } from 'react'
import type { ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback
      }

      return (
        <div className="min-h-screen bg-gradient-to-br from-red-50 to-pink-50 dark:from-gray-900 dark:to-red-900 flex items-center justify-center p-4">
          <div className="max-w-md w-full">
            <div className="card">
              <div className="text-center mb-6">
                <div className="text-6xl mb-4">⚠️</div>
                <h2 className="text-2xl font-bold text-red-600 dark:text-red-400 mb-2">
                  Something went wrong
                </h2>
                <p className="text-gray-600 dark:text-gray-400">
                  An unexpected error occurred while processing your request.
                </p>
              </div>

              <div className="space-y-4">
                {this.state.error && (
                  <details className="bg-red-50 dark:bg-red-900/30 rounded-lg p-4">
                    <summary className="cursor-pointer text-sm font-medium text-red-700 dark:text-red-300 mb-2">
                      Error Details
                    </summary>
                    <div className="text-xs font-mono text-red-600 dark:text-red-400 whitespace-pre-wrap break-all">
                      {this.state.error.message}
                      {this.state.error.stack && (
                        <div className="mt-2 pt-2 border-t border-red-200 dark:border-red-700">
                          {this.state.error.stack}
                        </div>
                      )}
                    </div>
                  </details>
                )}

                <div className="flex space-x-3">
                  <button 
                    onClick={() => window.location.reload()}
                    className="btn-primary flex-1"
                  >
                    Reload Page
                  </button>
                  <button 
                    onClick={() => this.setState({ hasError: false, error: undefined, errorInfo: undefined })}
                    className="btn-secondary flex-1"
                  >
                    Try Again
                  </button>
                </div>

                <div className="text-center">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    If the problem persists, please check your browser console or try refreshing the page.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary