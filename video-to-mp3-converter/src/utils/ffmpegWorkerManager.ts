import type {
  FFmpegWorkerMessage,
  FFmpegInitMessage,
  FFmpegConvertMessage,
  FFmpegWorkerResponse,
  FFmpegProgressMessage,
  FFmpegCompleteMessage,
  FFmpegErrorMessage,
  FFmpegReadyMessage,
} from '../types/index';

export interface ConversionOptions {
  bitrate?: string;
  onProgress?: (progress: number, time?: string) => void;
  signal?: AbortSignal;
}

export interface ConversionResult {
  data: Uint8Array;
  filename: string;
}

export class FFmpegWorkerManager {
  private static instance: FFmpegWorkerManager | null = null;
  private worker: Worker | null = null;
  private isInitialized = false;
  private isInitializing = false;
  private initPromise: Promise<void> | null = null;
  private messageId = 0;
  private pendingMessages = new Map<string, {
    resolve: (value: any) => void;
    reject: (error: Error) => void;
    onProgress?: (progress: number, time?: string) => void;
  }>();

  constructor() {
    this.createWorker();
  }

  /**
   * シングルトンインスタンスを取得
   */
  static getInstance(): FFmpegWorkerManager {
    if (!FFmpegWorkerManager.instance) {
      FFmpegWorkerManager.instance = new FFmpegWorkerManager();
    }
    return FFmpegWorkerManager.instance;
  }

  private createWorker(): void {
    try {
      // Create worker using Vite's worker syntax
      this.worker = new Worker(
        new URL('../workers/ffmpeg.worker.ts', import.meta.url),
        { type: 'module' }
      );

      this.worker.onmessage = this.handleWorkerMessage.bind(this);
      this.worker.onerror = this.handleWorkerError.bind(this);
      
      console.log('[FFmpeg Manager] Worker created successfully');
    } catch (error) {
      console.error('[FFmpeg Manager] Failed to create worker:', error);
      throw new Error('Failed to create FFmpeg worker');
    }
  }

  private handleWorkerMessage(event: MessageEvent<FFmpegWorkerResponse>): void {
    const message = event.data;
    const { type, id } = message;

    const pendingMessage = this.pendingMessages.get(id);

    switch (type) {
      case 'ready': {
        if (pendingMessage) {
          const readyData = (message as FFmpegReadyMessage).data;
          pendingMessage.resolve(readyData);
          this.pendingMessages.delete(id);
        }
        break;
      }

      case 'progress': {
        if (pendingMessage?.onProgress) {
          const progressData = (message as FFmpegProgressMessage).data;
          pendingMessage.onProgress(progressData.ratio, progressData.time);
        }
        break;
      }

      case 'complete': {
        if (pendingMessage) {
          const completeData = (message as FFmpegCompleteMessage).data;
          pendingMessage.resolve({
            data: completeData.outputData,
            filename: completeData.outputFilename,
          });
          this.pendingMessages.delete(id);
        }
        break;
      }

      case 'error': {
        if (pendingMessage) {
          const errorData = (message as FFmpegErrorMessage).data;
          const error = new Error(errorData.message);
          (error as any).code = errorData.code;
          pendingMessage.reject(error);
          this.pendingMessages.delete(id);
        }
        break;
      }

      default: {
        console.warn('[FFmpeg Manager] Unknown message type:', type);
      }
    }
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('[FFmpeg Manager] Worker error:', error);
    
    // Reject all pending messages
    const workerError = new Error(`Worker error: ${error.message}`);
    for (const [, pendingMessage] of this.pendingMessages) {
      pendingMessage.reject(workerError);
    }
    this.pendingMessages.clear();

    // Reset state
    this.isInitialized = false;
    this.isInitializing = false;
    this.initPromise = null;
  }

  private generateMessageId(): string {
    return `msg_${++this.messageId}_${Date.now()}`;
  }

  private sendMessage<T = any>(
    message: FFmpegWorkerMessage,
    onProgress?: (progress: number, time?: string) => void
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Worker is not available'));
        return;
      }

      const messageId = this.generateMessageId();
      message.id = messageId;

      this.pendingMessages.set(messageId, {
        resolve,
        reject,
        onProgress,
      });

      this.worker.postMessage(message);
    });
  }

  async initialize(coreURL?: string, wasmURL?: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.isInitializing = true;
    
    this.initPromise = (async () => {
      try {
        const initMessage: FFmpegInitMessage = {
          type: 'init',
          id: '', // Will be set by sendMessage
          data: {
            coreURL,
            wasmURL,
          },
        };

        await this.sendMessage(initMessage);
        this.isInitialized = true;
        this.isInitializing = false;
        
        console.log('[FFmpeg Manager] Initialization completed');
      } catch (error) {
        this.isInitializing = false;
        this.initPromise = null;
        
        console.error('[FFmpeg Manager] Initialization failed:', error);
        throw error;
      }
    })();

    return this.initPromise;
  }

  async convertVideoToMP3(
    file: File,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const {
      bitrate = '128k',
      onProgress,
      signal,
    } = options;

    // Create output filename
    const inputName = file.name.replace(/\.[^/.]+$/, '');
    const outputFilename = `${inputName}.mp3`;

    const convertMessage: FFmpegConvertMessage = {
      type: 'convert',
      id: '', // Will be set by sendMessage
      data: {
        file,
        outputFilename,
        bitrate,
      },
    };

    // Handle AbortSignal
    if (signal) {
      signal.addEventListener('abort', () => {
        // Note: Worker termination will be handled in a future enhancement
        console.warn('[FFmpeg Manager] Conversion aborted by user');
      });

      if (signal.aborted) {
        throw new Error('Conversion was aborted');
      }
    }

    try {
      const result = await this.sendMessage<ConversionResult>(convertMessage, onProgress);
      console.log(`[FFmpeg Manager] Conversion completed: ${outputFilename}`);
      return result;
    } catch (error) {
      console.error('[FFmpeg Manager] Conversion failed:', error);
      throw error;
    }
  }

  /**
   * 新しいconvert API - converter.tsから呼び出される
   */
  async convert(
    file: File,
    options: any = {},
    onProgress?: (progress: any) => void,
    signal?: AbortSignal
  ): Promise<Uint8Array> {
    const conversionOptions: ConversionOptions = {
      bitrate: options.bitrate ? `${options.bitrate}k` : '128k',
      onProgress: onProgress ? (ratio: number, time?: string) => {
        onProgress({
          fileId: '', // Will be set by caller
          percentage: ratio * 100,
          stage: ratio < 1 ? 'processing' : 'completed',
          timeRemaining: null,
          processedTime: time || null,
          totalTime: null,
          speed: null
        });
      } : undefined,
      signal
    };

    const result = await this.convertVideoToMP3(file, conversionOptions);
    return result.data;
  }

  async getStatus(): Promise<{
    initialized: boolean;
    initializing: boolean;
    error: string | null;
  }> {
    if (!this.worker) {
      return {
        initialized: false,
        initializing: false,
        error: 'Worker not available',
      };
    }

    try {
      const statusMessage: FFmpegWorkerMessage = {
        type: 'status',
        id: '',
      };

      return await this.sendMessage(statusMessage);
    } catch (error) {
      return {
        initialized: this.isInitialized,
        initializing: this.isInitializing,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  isReady(): boolean {
    return this.isInitialized && !this.isInitializing && this.worker !== null;
  }

  terminate(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }

    // Reject all pending messages
    const terminationError = new Error('Worker was terminated');
    for (const [, pendingMessage] of this.pendingMessages) {
      pendingMessage.reject(terminationError);
    }
    this.pendingMessages.clear();

    // Reset state
    this.isInitialized = false;
    this.isInitializing = false;
    this.initPromise = null;

    console.log('[FFmpeg Manager] Worker terminated');
  }

  // Clean up resources when the manager is no longer needed
  destroy(): Promise<void> {
    return new Promise((resolve) => {
      this.terminate();
      resolve();
    });
  }
}

// Singleton instance for global use
let globalFFmpegManager: FFmpegWorkerManager | null = null;

export function getFFmpegManager(): FFmpegWorkerManager {
  if (!globalFFmpegManager) {
    globalFFmpegManager = new FFmpegWorkerManager();
  }
  return globalFFmpegManager;
}

export function destroyFFmpegManager(): void {
  if (globalFFmpegManager) {
    globalFFmpegManager.destroy();
    globalFFmpegManager = null;
  }
}

// Clean up on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', destroyFFmpegManager);
}