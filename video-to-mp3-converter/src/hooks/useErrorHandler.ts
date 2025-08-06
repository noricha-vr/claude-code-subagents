import { useState, useCallback } from 'react'

export interface ErrorInfo {
  message: string
  code?: string
  timestamp: Date
  context?: string
}

export const useErrorHandler = () => {
  const [errors, setErrors] = useState<ErrorInfo[]>([])

  const addError = useCallback((error: string | Error, context?: string) => {
    const errorMessage = error instanceof Error ? error.message : error
    const errorCode = error instanceof Error ? error.name : undefined

    const errorInfo: ErrorInfo = {
      message: errorMessage,
      code: errorCode,
      timestamp: new Date(),
      context
    }

    setErrors(prev => [...prev, errorInfo])

    // Log error to console for debugging
    console.error('Error:', errorInfo)

    return errorInfo
  }, [])

  const removeError = useCallback((index: number) => {
    setErrors(prev => prev.filter((_, i) => i !== index))
  }, [])

  const clearErrors = useCallback(() => {
    setErrors([])
  }, [])

  const handleFFmpegError = useCallback((error: Error) => {
    let userMessage = 'FFmpegライブラリでエラーが発生しました。'
    
    if (error.message.includes('SharedArrayBuffer')) {
      userMessage = 'ブラウザの設定によりFFmpegが正常に動作できません。別のブラウザをお試しください。'
    } else if (error.message.includes('fetch')) {
      userMessage = 'FFmpegライブラリの読み込みに失敗しました。インターネット接続を確認してください。'
    } else if (error.message.includes('memory')) {
      userMessage = 'メモリ不足です。より小さなファイルをお試しください。'
    } else if (error.message.includes('format')) {
      userMessage = 'サポートされていない動画形式です。別のファイルをお試しください。'
    }

    return addError(userMessage, 'ffmpeg')
  }, [addError])

  const handleFileError = useCallback((error: Error | string) => {
    let userMessage = typeof error === 'string' ? error : error.message
    
    if (typeof error !== 'string') {
      if (error.message.includes('size')) {
        userMessage = 'ファイルサイズが大きすぎます。500MB以下のファイルを選択してください。'
      } else if (error.message.includes('type') || error.message.includes('format')) {
        userMessage = 'サポートされていないファイル形式です。MP4, AVI, MOV等の動画ファイルを選択してください。'
      } else if (error.message.includes('corrupted') || error.message.includes('invalid')) {
        userMessage = 'ファイルが破損している可能性があります。別のファイルをお試しください。'
      }
    }

    return addError(userMessage, 'file')
  }, [addError])

  const handleNetworkError = useCallback((_error: Error) => {
    const userMessage = 'ネットワークエラーが発生しました。インターネット接続を確認してください。'
    return addError(userMessage, 'network')
  }, [addError])

  const handleGenericError = useCallback((error: Error | string, context?: string) => {
    let userMessage = '予期しないエラーが発生しました。'
    
    if (typeof error !== 'string') {
      if (error.message.includes('timeout')) {
        userMessage = '処理がタイムアウトしました。もう一度お試しください。'
      } else if (error.message.includes('abort')) {
        userMessage = '処理が中断されました。'
      }
    }

    return addError(userMessage, context)
  }, [addError])

  return {
    errors,
    addError,
    removeError,
    clearErrors,
    handleFFmpegError,
    handleFileError,
    handleNetworkError,
    handleGenericError,
    hasErrors: errors.length > 0,
    latestError: errors[errors.length - 1] || null
  }
}