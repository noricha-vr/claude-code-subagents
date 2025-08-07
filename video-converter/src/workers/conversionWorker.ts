import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

// Worker message types
interface WorkerMessage {
  type: 'initialize' | 'convert' | 'cleanup';
  payload?: any;
}

interface WorkerResponse {
  type: 'initialized' | 'progress' | 'completed' | 'error';
  payload?: any;
}

class ConversionWorker {
  private ffmpeg: FFmpeg | null = null;
  private isInitialized = false;

  constructor() {
    self.onmessage = this.handleMessage.bind(this);
  }

  private async handleMessage(event: MessageEvent<WorkerMessage>) {
    const { type, payload } = event.data;

    try {
      switch (type) {
        case 'initialize':
          await this.initialize();
          break;
        
        case 'convert':
          await this.convert(payload);
          break;
        
        case 'cleanup':
          await this.cleanup();
          break;
        
        default:
          throw new Error(`Unknown message type: ${type}`);
      }
    } catch (error) {
      this.postMessage({
        type: 'error',
        payload: {
          message: error instanceof Error ? error.message : 'Unknown error',
          stack: error instanceof Error ? error.stack : undefined
        }
      });
    }
  }

  private async initialize() {
    if (this.isInitialized) {
      this.postMessage({ type: 'initialized' });
      return;
    }

    try {
      this.ffmpeg = new FFmpeg();
      
      // Load FFmpeg core
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      this.postMessage({
        type: 'progress',
        payload: { progress: 10, step: 'Loading FFmpeg core...' }
      });
      
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
      
      this.postMessage({
        type: 'progress',
        payload: { progress: 50, step: 'Loading WebAssembly...' }
      });
      
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
      
      this.postMessage({
        type: 'progress',
        payload: { progress: 80, step: 'Initializing FFmpeg...' }
      });

      await this.ffmpeg.load({
        coreURL,
        wasmURL,
      });

      this.isInitialized = true;
      
      this.postMessage({
        type: 'initialized',
        payload: { progress: 100, step: 'FFmpeg ready!' }
      });

    } catch (error) {
      throw new Error(`Failed to initialize FFmpeg: ${error}`);
    }
  }

  private async convert(payload: { fileData: ArrayBuffer; fileName: string; fileId: string }) {
    if (!this.ffmpeg || !this.isInitialized) {
      throw new Error('FFmpeg not initialized');
    }

    const { fileData, fileName, fileId } = payload;
    const inputName = `input_${fileId}.${this.getFileExtension(fileName)}`;
    const outputName = `output_${fileId}.mp3`;

    try {
      // Write input file
      this.postMessage({
        type: 'progress',
        payload: {
          fileId,
          progress: 10,
          step: 'Preparing file...'
        }
      });

      await this.ffmpeg.writeFile(inputName, new Uint8Array(fileData));

      // Set up progress monitoring
      this.setupProgressMonitoring(fileId);

      this.postMessage({
        type: 'progress',
        payload: {
          fileId,
          progress: 20,
          step: 'Converting to MP3...'
        }
      });

      // Execute conversion
      await this.ffmpeg.exec([
        '-i', inputName,
        '-codec:a', 'libmp3lame',
        '-b:a', '128k',
        '-ar', '44100',
        '-ac', '2',
        '-f', 'mp3',
        outputName
      ]);

      this.postMessage({
        type: 'progress',
        payload: {
          fileId,
          progress: 90,
          step: 'Finalizing...'
        }
      });

      // Read output file
      const outputData = await this.ffmpeg.readFile(outputName) as Uint8Array;

      // Clean up
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      // Send completion message
      this.postMessage({
        type: 'completed',
        payload: {
          fileId,
          data: outputData,
          name: this.generateMP3Name(fileName),
          size: outputData.length
        }
      });

    } catch (error) {
      // Clean up files on error
      try {
        await this.ffmpeg.deleteFile(inputName);
        await this.ffmpeg.deleteFile(outputName);
      } catch (cleanupError) {
        console.warn('Failed to clean up files:', cleanupError);
      }

      throw new Error(`Conversion failed: ${error}`);
    }
  }

  private setupProgressMonitoring(fileId: string) {
    if (!this.ffmpeg) return;

    this.ffmpeg.on('log', ({ type, message }) => {
      if (type === 'fferr') {
        // Parse progress from FFmpeg logs
        const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        const progressMatch = message.match(/progress=(\w+)/);
        
        if (timeMatch) {
          const hours = parseInt(timeMatch[1]);
          const minutes = parseInt(timeMatch[2]);
          const seconds = parseInt(timeMatch[3]);
          const totalSeconds = hours * 3600 + minutes * 60 + seconds;
          
          // This is a rough progress estimation
          // In a real app, you'd need to know the total duration
          const estimatedProgress = Math.min(85, 20 + (totalSeconds / 10));
          
          this.postMessage({
            type: 'progress',
            payload: {
              fileId,
              progress: Math.round(estimatedProgress),
              step: 'Converting audio stream...'
            }
          });
        }
        
        if (progressMatch && progressMatch[1] === 'end') {
          this.postMessage({
            type: 'progress',
            payload: {
              fileId,
              progress: 85,
              step: 'Conversion complete, processing output...'
            }
          });
        }
      }
    });
  }

  private async cleanup() {
    if (this.ffmpeg) {
      try {
        await this.ffmpeg.terminate();
      } catch (error) {
        console.warn('Error terminating FFmpeg:', error);
      }
      this.ffmpeg = null;
    }
    this.isInitialized = false;
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'mp4';
  }

  private generateMP3Name(originalName: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}.mp3`;
  }

  private postMessage(message: WorkerResponse) {
    self.postMessage(message);
  }
}

// Initialize worker
new ConversionWorker();