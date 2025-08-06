import React, { useEffect, useState } from 'react'

interface ErrorMessageProps {
  message: string
  onDismiss?: () => void
  type?: 'error' | 'warning' | 'info'
  autoHide?: boolean
  autoHideDelay?: number
}

const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  onDismiss,
  type = 'error',
  autoHide = true,
  autoHideDelay = 5000
}) => {
  const [isVisible, setIsVisible] = useState(true)

  useEffect(() => {
    if (autoHide && autoHideDelay > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false)
        if (onDismiss) {
          setTimeout(onDismiss, 300) // Wait for fade out animation
        }
      }, autoHideDelay)

      return () => clearTimeout(timer)
    }
  }, [autoHide, autoHideDelay, onDismiss])

  const handleDismiss = () => {
    setIsVisible(false)
    if (onDismiss) {
      setTimeout(onDismiss, 300) // Wait for fade out animation
    }
  }

  const getTypeStyles = () => {
    switch (type) {
      case 'warning':
        return {
          container: 'bg-yellow-50 border-yellow-200',
          icon: 'text-yellow-600',
          text: 'text-yellow-800',
          button: 'text-yellow-600 hover:text-yellow-800'
        }
      case 'info':
        return {
          container: 'bg-blue-50 border-blue-200',
          icon: 'text-blue-600',
          text: 'text-blue-800',
          button: 'text-blue-600 hover:text-blue-800'
        }
      default: // error
        return {
          container: 'bg-red-50 border-red-200',
          icon: 'text-red-600',
          text: 'text-red-800',
          button: 'text-red-600 hover:text-red-800'
        }
    }
  }

  const getIcon = () => {
    switch (type) {
      case 'warning':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z"
            />
          </svg>
        )
      case 'info':
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
      default: // error
        return (
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        )
    }
  }

  const getTitle = () => {
    switch (type) {
      case 'warning':
        return '警告'
      case 'info':
        return '情報'
      default:
        return 'エラー'
    }
  }

  const styles = getTypeStyles()

  if (!isVisible) {
    return null
  }

  return (
    <div
      className={`
        ${styles.container}
        border rounded-lg p-4 transition-all duration-300 transform
        ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}
      `}
    >
      <div className="flex items-start space-x-3">
        <div className={`${styles.icon} flex-shrink-0 mt-0.5`}>
          {getIcon()}
        </div>
        
        <div className="flex-1 min-w-0">
          <h3 className={`${styles.text} font-semibold text-sm mb-1`}>
            {getTitle()}
          </h3>
          <p className={`${styles.text} text-sm leading-relaxed`}>
            {message}
          </p>
        </div>

        {onDismiss && (
          <button
            onClick={handleDismiss}
            className={`
              ${styles.button}
              flex-shrink-0 p-1 rounded-full
              hover:bg-black hover:bg-opacity-5
              transition-colors duration-200
              focus:outline-none focus:ring-2 focus:ring-offset-2
            `}
            aria-label="エラーメッセージを閉じる"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>

      {/* Progress bar for auto-hide */}
      {autoHide && autoHideDelay > 0 && (
        <div className="mt-3">
          <div className="w-full bg-black bg-opacity-10 rounded-full h-1">
            <div
              className={`h-1 rounded-full transition-all ease-linear ${
                type === 'warning' ? 'bg-yellow-400' :
                type === 'info' ? 'bg-blue-400' : 'bg-red-400'
              }`}
              style={{
                width: '100%',
                animation: `shrink ${autoHideDelay}ms linear forwards`
              }}
            />
          </div>
        </div>
      )}

      <style>{`
        @keyframes shrink {
          from {
            width: 100%;
          }
          to {
            width: 0%;
          }
        }
      `}</style>
    </div>
  )
}

export default ErrorMessage