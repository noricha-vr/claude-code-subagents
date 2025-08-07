/// <reference lib="webworker" />

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import type {
  FFmpegWorkerMessage,
  FFmpegInitMessage,
  FFmpegConvertMessage,
  FFmpegProgressMessage,
  FFmpegCompleteMessage,
  FFmpegErrorMessage,
  FFmpegReadyMessage,
} from '../types/index';

// Define the worker context
declare const self: DedicatedWorkerGlobalScope;

class FFmpegWorkerService {
  private ffmpeg: FFmpeg;
  private isInitialized = false;
  private isInitializing = false;
  private initializationError: string | null = null;

  constructor() {
    this.ffmpeg = new FFmpeg();
    this.setupEventHandlers();
  }

  private setupEventHandlers(): void {
    // Progress tracking
    this.ffmpeg.on('progress', (progress) => {
      const progressMessage: FFmpegProgressMessage = {
        type: 'progress',
        id: 'current',
        data: {
          ratio: progress.progress || 0,
          time: progress.time?.toString(),
        },
      };
      self.postMessage(progressMessage);
    });

    // Logging (optional, for debugging)
    this.ffmpeg.on('log', ({ message, type }) => {
      if (type === 'error') {
        console.error(`[FFmpeg Worker] ${message}`);
      } else if (type === 'warning') {
        console.warn(`[FFmpeg Worker] ${message}`);
      } else {
        console.log(`[FFmpeg Worker] ${message}`);
      }
    });
  }

  async initialize(coreURL?: string, wasmURL?: string): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.isInitializing) {
      throw new Error('FFmpeg is already being initialized');
    }

    if (this.initializationError) {
      throw new Error(`Previous initialization failed: ${this.initializationError}`);
    }

    this.isInitializing = true;

    try {
      // Check for Cross-Origin Isolation
      if (!self.crossOriginIsolated) {
        throw new Error(
          'Cross-Origin Isolation is required for FFmpeg.wasm. ' +
          'Please ensure proper headers are set: ' +
          'Cross-Origin-Embedder-Policy: require-corp, ' +
          'Cross-Origin-Opener-Policy: same-origin'
        );
      }

      // Check for SharedArrayBuffer support
      if (typeof SharedArrayBuffer === 'undefined') {
        throw new Error(
          'SharedArrayBuffer is not available. ' +
          'This is required for FFmpeg.wasm to function properly.'
        );
      }

      // Use provided URLs or fallback to default CDN URLs
      const coreJSURL = coreURL || 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js';
      const wasmFileURL = wasmURL || 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm';

      // Convert URLs to blob URLs for better performance and security
      const coreURL_blob = await toBlobURL(coreJSURL, 'text/javascript');
      const wasmURL_blob = await toBlobURL(wasmFileURL, 'application/wasm');

      // Load FFmpeg with the blob URLs
      await this.ffmpeg.load({
        coreURL: coreURL_blob,
        wasmURL: wasmURL_blob,
      });

      this.isInitialized = true;
      this.isInitializing = false;
      this.initializationError = null;

      console.log('[FFmpeg Worker] Initialization completed successfully');

    } catch (error) {
      this.isInitializing = false;
      this.initializationError = error instanceof Error ? error.message : 'Unknown initialization error';
      
      console.error('[FFmpeg Worker] Initialization failed:', error);
      throw error;
    }
  }

  async convertVideoToMP3(
    file: File,
    outputFilename: string,
    bitrate: string = '128k'
  ): Promise<Uint8Array> {
    if (!this.isInitialized) {
      throw new Error('FFmpeg is not initialized. Call initialize() first.');
    }

    try {
      const inputFilename = `input_${Date.now()}.${file.name.split('.').pop() || 'mp4'}`;
      
      // Read file data
      const fileData = new Uint8Array(await file.arrayBuffer());
      
      // Write input file to FFmpeg FS
      await this.ffmpeg.writeFile(inputFilename, fileData);

      // Convert video to MP3 with specified bitrate
      await this.ffmpeg.exec([
        '-i', inputFilename,           // Input file
        '-vn',                         // No video stream
        '-ar', '44100',                // Audio sample rate
        '-ac', '2',                    // Stereo (2 channels)
        '-b:a', bitrate,               // Audio bitrate
        '-f', 'mp3',                   // Output format
        '-y',                          // Overwrite output file
        outputFilename
      ]);

      // Read the converted file
      const outputData = await this.ffmpeg.readFile(outputFilename);

      // Clean up files from FFmpeg FS
      try {
        await this.ffmpeg.deleteFile(inputFilename);
        await this.ffmpeg.deleteFile(outputFilename);
      } catch (cleanupError) {
        console.warn('[FFmpeg Worker] Cleanup warning:', cleanupError);
      }

      // Return the output data as Uint8Array
      if (outputData instanceof Uint8Array) {
        return outputData;
      } else {
        throw new Error('Invalid output data format from FFmpeg');
      }

    } catch (error) {
      console.error('[FFmpeg Worker] Conversion failed:', error);
      throw error;
    }
  }

  isReady(): boolean {
    return this.isInitialized && !this.isInitializing;
  }

  getStatus(): { initialized: boolean; initializing: boolean; error: string | null } {
    return {
      initialized: this.isInitialized,
      initializing: this.isInitializing,
      error: this.initializationError,
    };
  }
}

// Create worker service instance
const workerService = new FFmpegWorkerService();

// Message handler
self.onmessage = async (event: MessageEvent<FFmpegWorkerMessage>) => {
  const { type, id, data } = event.data;

  try {
    switch (type) {
      case 'init': {
        const initData = data as FFmpegInitMessage['data'];
        
        try {
          await workerService.initialize(initData?.coreURL, initData?.wasmURL);
          
          const readyMessage: FFmpegReadyMessage = {
            type: 'ready',
            id,
            data: {},
          };
          self.postMessage(readyMessage);

        } catch (error) {
          const errorMessage: FFmpegErrorMessage = {
            type: 'error',
            id,
            data: {
              message: error instanceof Error ? error.message : 'Initialization failed',
              code: 'INIT_ERROR',
            },
          };
          self.postMessage(errorMessage);
        }
        break;
      }

      case 'convert': {
        const convertData = data as FFmpegConvertMessage['data'];
        const { file, outputFilename, bitrate = '128k' } = convertData;

        if (!workerService.isReady()) {
          throw new Error('FFmpeg worker is not ready for conversion');
        }

        try {
          const outputData = await workerService.convertVideoToMP3(file, outputFilename, bitrate);
          
          const completeMessage: FFmpegCompleteMessage = {
            type: 'complete',
            id,
            data: {
              outputData,
              outputFilename,
            },
          };
          self.postMessage(completeMessage);

        } catch (error) {
          const errorMessage: FFmpegErrorMessage = {
            type: 'error',
            id,
            data: {
              message: error instanceof Error ? error.message : 'Conversion failed',
              code: 'CONVERT_ERROR',
            },
          };
          self.postMessage(errorMessage);
        }
        break;
      }

      case 'status': {
        const status = workerService.getStatus();
        const statusMessage: FFmpegWorkerMessage = {
          type: 'status',
          id,
          data: status,
        };
        self.postMessage(statusMessage);
        break;
      }

      default: {
        const errorMessage: FFmpegErrorMessage = {
          type: 'error',
          id,
          data: {
            message: `Unknown message type: ${type}`,
            code: 'UNKNOWN_MESSAGE',
          },
        };
        self.postMessage(errorMessage);
      }
    }

  } catch (error) {
    const errorMessage: FFmpegErrorMessage = {
      type: 'error',
      id,
      data: {
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        code: 'WORKER_ERROR',
      },
    };
    self.postMessage(errorMessage);
  }
};

// Handle uncaught errors
self.onerror = (error) => {
  console.error('[FFmpeg Worker] Uncaught error:', error);
  
  const errorMessage: FFmpegErrorMessage = {
    type: 'error',
    id: 'uncaught',
    data: {
      message: 'Uncaught worker error occurred',
      code: 'UNCAUGHT_ERROR',
    },
  };
  self.postMessage(errorMessage);
};

// Handle unhandled promise rejections
self.onunhandledrejection = (event) => {
  console.error('[FFmpeg Worker] Unhandled promise rejection:', event.reason);
  
  const errorMessage: FFmpegErrorMessage = {
    type: 'error',
    id: 'unhandled_rejection',
    data: {
      message: 'Unhandled promise rejection in worker',
      code: 'UNHANDLED_REJECTION',
    },
  };
  self.postMessage(errorMessage);
};

console.log('[FFmpeg Worker] Worker initialized and ready to receive messages');

// Export for TypeScript (this won't be executed in worker context)
export default null;