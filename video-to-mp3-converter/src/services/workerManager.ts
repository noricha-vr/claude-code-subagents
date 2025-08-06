import { ConversionProgress, ConversionResult, VideoFile, ConversionOptions, FFmpegWorkerMessage, WorkerResponse } from '../types'

export class WorkerManager {
  private worker: Worker | null = null
  private isWorkerReady = false
  private onProgress?: (progress: ConversionProgress) => void
  private pendingPromise: {
    resolve: (result: ConversionResult) => void
    reject: (error: Error) => void
  } | null = null

  constructor() {
    this.initializeWorker()
  }

  private initializeWorker(): void {
    try {
      // Create worker from TypeScript file
      // Vite will handle the TypeScript compilation and bundling
      this.worker = new Worker(
        new URL('../workers/ffmpegWorker.ts', import.meta.url),
        { type: 'module' }
      )

      this.setupWorkerListeners()
    } catch (error) {
      console.error('Failed to create worker:', error)
      throw new Error('Web Workers are not supported in this environment')
    }
  }

  private setupWorkerListeners(): void {
    if (!this.worker) return

    this.worker.addEventListener('message', (event: MessageEvent<WorkerResponse>) => {
      const { type, payload, error } = event.data

      switch (type) {
        case 'ready':
          this.isWorkerReady = true
          console.log('FFmpeg worker is ready')
          break

        case 'progress':
          if (this.onProgress && payload) {
            this.onProgress(payload as ConversionProgress)
          }
          break

        case 'complete':
          if (this.pendingPromise) {
            const result = payload as ConversionResult
            this.pendingPromise.resolve(result)
            this.pendingPromise = null
          }
          break

        case 'error':
          console.error('Worker error:', error)
          if (this.pendingPromise) {
            this.pendingPromise.reject(new Error(error || 'Unknown worker error'))
            this.pendingPromise = null
          }
          break

        case 'status':
          console.log('Worker status:', payload)
          break

        case 'terminated':
          console.log('Worker terminated')
          this.isWorkerReady = false
          this.worker = null
          break

        default:
          console.warn('Unknown worker message type:', type)
      }
    })

    this.worker.addEventListener('error', (event) => {
      console.error('Worker error event:', event)
      if (this.pendingPromise) {
        this.pendingPromise.reject(new Error('Worker encountered an error'))
        this.pendingPromise = null
      }
    })

    this.worker.addEventListener('messageerror', (event) => {
      console.error('Worker message error:', event)
      if (this.pendingPromise) {
        this.pendingPromise.reject(new Error('Worker message error'))
        this.pendingPromise = null
      }
    })
  }

  setProgressCallback(callback: (progress: ConversionProgress) => void): void {
    this.onProgress = callback
  }

  async loadFFmpeg(): Promise<void> {
    if (!this.worker) {
      throw new Error('Worker is not available')
    }

    if (this.isWorkerReady) {
      return Promise.resolve()
    }

    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker is not available'))
        return
      }

      const timeout = setTimeout(() => {
        reject(new Error('FFmpeg load timeout'))
      }, 60000) // 60 second timeout

      const originalListener = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'ready') {
          clearTimeout(timeout)
          this.worker!.removeEventListener('message', originalListener)
          resolve()
        } else if (event.data.type === 'error') {
          clearTimeout(timeout)
          this.worker!.removeEventListener('message', originalListener)
          reject(new Error(event.data.error || 'FFmpeg load failed'))
        }
      }

      this.worker.addEventListener('message', originalListener)

      const message: FFmpegWorkerMessage = {
        type: 'load'
      }
      
      this.worker.postMessage(message)
    })
  }

  async convertVideo(videoFile: VideoFile, options?: ConversionOptions): Promise<ConversionResult> {
    if (!this.worker) {
      throw new Error('Worker is not available')
    }

    if (!this.isWorkerReady) {
      throw new Error('FFmpeg is not loaded. Call loadFFmpeg() first.')
    }

    if (this.pendingPromise) {
      throw new Error('Another conversion is already in progress')
    }

    return new Promise((resolve, reject) => {
      this.pendingPromise = { resolve, reject }

      const timeout = setTimeout(() => {
        if (this.pendingPromise) {
          this.pendingPromise.reject(new Error('Conversion timeout'))
          this.pendingPromise = null
        }
      }, 300000) // 5 minute timeout

      // Clear timeout when promise resolves/rejects
      const originalResolve = resolve
      const originalReject = reject

      this.pendingPromise.resolve = (result) => {
        clearTimeout(timeout)
        originalResolve(result)
      }

      this.pendingPromise.reject = (error) => {
        clearTimeout(timeout)
        originalReject(error)
      }

      const message: FFmpegWorkerMessage = {
        type: 'convert',
        payload: {
          videoFile,
          options: options || { bitrate: 128, quality: 'standard' }
        }
      }

      this.worker!.postMessage(message)
    })
  }

  async terminate(): Promise<void> {
    if (!this.worker) {
      return
    }

    return new Promise((resolve) => {
      if (!this.worker) {
        resolve()
        return
      }

      const timeout = setTimeout(() => {
        // Force terminate if worker doesn't respond
        if (this.worker) {
          this.worker.terminate()
          this.worker = null
        }
        this.isWorkerReady = false
        resolve()
      }, 5000) // 5 second timeout

      const terminateListener = (event: MessageEvent<WorkerResponse>) => {
        if (event.data.type === 'terminated') {
          clearTimeout(timeout)
          this.worker = null
          this.isWorkerReady = false
          resolve()
        }
      }

      this.worker.addEventListener('message', terminateListener)

      const message: FFmpegWorkerMessage = {
        type: 'terminate'
      }

      this.worker.postMessage(message)
    })
  }

  isReady(): boolean {
    return this.isWorkerReady && this.worker !== null
  }

  isAvailable(): boolean {
    return this.worker !== null
  }
}