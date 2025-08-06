import { FFmpegService } from '../services/ffmpegService'
import { VideoFile, ConversionOptions, ConversionResult, FFmpegWorkerMessage, WorkerResponse } from '../types'

// Worker context type assertion
declare const self: Worker

class FFmpegWorker {
  private ffmpegService: FFmpegService
  private isInitialized = false

  constructor() {
    this.ffmpegService = new FFmpegService()
    this.setupProgressCallback()
  }

  private setupProgressCallback() {
    this.ffmpegService.setProgressCallback((progress) => {
      this.postMessage({
        type: 'progress',
        payload: progress
      })
    })
  }

  public postMessage(response: WorkerResponse) {
    self.postMessage(response)
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) return

    try {
      this.postMessage({
        type: 'status',
        payload: { message: 'Initializing FFmpeg...' }
      })

      await this.ffmpegService.load()
      this.isInitialized = true

      this.postMessage({
        type: 'ready',
        payload: { message: 'FFmpeg is ready for conversion' }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.postMessage({
        type: 'error',
        payload: { error: errorMessage },
        error: errorMessage
      })
    }
  }

  async convertVideo(videoFile: VideoFile, options: ConversionOptions): Promise<void> {
    if (!this.isInitialized) {
      this.postMessage({
        type: 'error',
        payload: { error: 'FFmpeg is not initialized' },
        error: 'FFmpeg is not initialized'
      })
      return
    }

    try {
      this.postMessage({
        type: 'status',
        payload: { message: 'Starting conversion...' }
      })

      const result: ConversionResult = await this.ffmpegService.convert(videoFile, options)

      this.postMessage({
        type: 'complete',
        payload: result
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      const result: ConversionResult = {
        success: false,
        error: errorMessage
      }

      this.postMessage({
        type: 'complete',
        payload: result
      })
    }
  }

  async terminate(): Promise<void> {
    try {
      await this.ffmpegService.terminate()
      this.isInitialized = false
      
      this.postMessage({
        type: 'terminated',
        payload: { message: 'Worker terminated successfully' }
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.postMessage({
        type: 'error',
        payload: { error: errorMessage },
        error: errorMessage
      })
    }
  }
}

// Create worker instance
const worker = new FFmpegWorker()

// Handle messages from main thread
self.addEventListener('message', async (event: MessageEvent<FFmpegWorkerMessage>) => {
  const { type, payload } = event.data

  try {
    switch (type) {
      case 'load':
        await worker.initialize()
        break

      case 'convert':
        if (payload && typeof payload === 'object' && 'videoFile' in payload) {
          const { videoFile, options = { bitrate: 128, quality: 'standard' } } = payload as {
            videoFile: VideoFile
            options?: ConversionOptions
          }
          await worker.convertVideo(videoFile, options)
        } else {
          throw new Error('Invalid convert payload')
        }
        break

      case 'terminate':
        await worker.terminate()
        break

      default:
        throw new Error(`Unknown message type: ${type}`)
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error)
    
    worker.postMessage({
      type: 'error',
      payload: { error: errorMessage },
      error: errorMessage
    })
  }
})

// Handle worker errors
self.addEventListener('error', (event: ErrorEvent) => {
  worker.postMessage({
    type: 'error',
    payload: { error: event.message },
    error: event.message
  })
})

// Handle unhandled promise rejections
self.addEventListener('unhandledrejection', (event) => {
  const promiseEvent = event as PromiseRejectionEvent
  worker.postMessage({
    type: 'error',
    payload: { error: promiseEvent.reason },
    error: String(promiseEvent.reason)
  })
  event.preventDefault()
})

export {}