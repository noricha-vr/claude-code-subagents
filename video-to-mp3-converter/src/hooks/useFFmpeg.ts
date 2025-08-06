import { useState, useRef, useCallback, useEffect } from 'react'
import { WorkerManager } from '../services/workerManager'
import { ConversionProgress, ConversionResult, VideoFile, ConversionOptions } from '../types'
import { useErrorHandler } from './useErrorHandler'

export const useFFmpeg = () => {
  const [isLoading, setIsLoading] = useState(false)
  const [isReady, setIsReady] = useState(false)
  const [progress, setProgress] = useState<ConversionProgress>({
    phase: 'initializing',
    progress: 0,
    message: 'FFmpegを初期化しています...'
  })
  
  const workerManagerRef = useRef<WorkerManager | null>(null)
  const { handleFFmpegError, handleGenericError } = useErrorHandler()

  // Initialize worker manager
  const initializeWorkerManager = useCallback(() => {
    try {
      if (!workerManagerRef.current) {
        workerManagerRef.current = new WorkerManager()
        workerManagerRef.current.setProgressCallback(setProgress)
      }
      return workerManagerRef.current
    } catch (error) {
      handleGenericError(error instanceof Error ? error : new Error(String(error)), 'worker-init')
      return null
    }
  }, [handleGenericError])

  // Load FFmpeg
  const loadFFmpeg = useCallback(async () => {
    const workerManager = initializeWorkerManager()
    if (!workerManager) {
      throw new Error('Worker initialization failed')
    }

    if (isReady) return

    setIsLoading(true)
    setProgress({
      phase: 'loading',
      progress: 0,
      message: 'FFmpegライブラリを初期化しています...'
    })

    try {
      await workerManager.loadFFmpeg()
      setIsReady(true)
      setProgress({
        phase: 'ready',
        progress: 0,
        message: 'FFmpegが準備完了しました。変換を開始できます。'
      })
    } catch (error) {
      console.error('FFmpeg load error:', error)
      handleFFmpegError(error instanceof Error ? error : new Error(String(error)))
      setProgress({
        phase: 'error',
        progress: 0,
        message: 'FFmpegの読み込みに失敗しました'
      })
      throw error
    } finally {
      setIsLoading(false)
    }
  }, [initializeWorkerManager, isReady, handleFFmpegError])

  // Convert video
  const convertVideo = useCallback(async (
    videoFile: VideoFile,
    options?: ConversionOptions
  ): Promise<ConversionResult> => {
    const workerManager = workerManagerRef.current
    if (!workerManager) {
      throw new Error('Worker not initialized')
    }

    if (!isReady) {
      throw new Error('FFmpeg not loaded. Call loadFFmpeg() first.')
    }

    setProgress({
      phase: 'converting',
      progress: 0,
      message: '変換を開始しています...'
    })

    try {
      const result = await workerManager.convertVideo(videoFile, options)

      if (result.success) {
        setProgress({
          phase: 'complete',
          progress: 100,
          message: '変換が完了しました！'
        })
      } else {
        setProgress({
          phase: 'error',
          progress: 0,
          message: result.error || '変換に失敗しました'
        })
        handleGenericError(new Error(result.error || 'Conversion failed'), 'conversion')
      }

      return result
    } catch (error) {
      console.error('Conversion error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      setProgress({
        phase: 'error',
        progress: 0,
        message: '変換中にエラーが発生しました'
      })

      handleFFmpegError(error instanceof Error ? error : new Error(errorMessage))

      return {
        success: false,
        error: errorMessage
      }
    }
  }, [isReady, handleFFmpegError, handleGenericError])

  // Reset state
  const reset = useCallback(() => {
    setProgress({
      phase: 'ready',
      progress: 0,
      message: 'FFmpegが準備完了しました。変換を開始できます。'
    })
  }, [])

  // Terminate worker
  const terminate = useCallback(async () => {
    if (workerManagerRef.current) {
      try {
        await workerManagerRef.current.terminate()
      } catch (error) {
        console.warn('Error terminating worker:', error)
      } finally {
        workerManagerRef.current = null
        setIsReady(false)
        setIsLoading(false)
        setProgress({
          phase: 'initializing',
          progress: 0,
          message: 'FFmpegを初期化しています...'
        })
      }
    }
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (workerManagerRef.current) {
        workerManagerRef.current.terminate().catch(console.warn)
      }
    }
  }, [])

  return {
    isLoading,
    isReady,
    progress,
    loadFFmpeg,
    convertVideo,
    reset,
    terminate,
    workerAvailable: !!workerManagerRef.current?.isAvailable()
  }
}