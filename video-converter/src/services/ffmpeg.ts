import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type { 
  ConversionProgress, 
  ConversionResult, 
  ConversionStatus,
  ConversionError,
  ErrorType 
} from '@/types';

export class FFmpegService {
  private ffmpeg: FFmpeg | null = null;
  private isLoading = false;
  private isReady = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async initialize(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isReady) return;
    if (this.isLoading) {
      throw new Error('FFmpeg is already loading');
    }

    this.isLoading = true;
    
    try {
      if (!this.ffmpeg) {
        this.ffmpeg = new FFmpeg();
      }

      // Load FFmpeg core with progress tracking
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm';
      
      onProgress?.(10);
      
      const coreURL = await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript');
      onProgress?.(30);
      
      const wasmURL = await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm');
      onProgress?.(60);

      await this.ffmpeg.load({
        coreURL,
        wasmURL,
      });

      onProgress?.(100);
      
      this.isReady = true;
      this.isLoading = false;

      console.log('FFmpeg loaded successfully');
    } catch (error) {
      this.isLoading = false;
      this.isReady = false;
      console.error('Failed to load FFmpeg:', error);
      throw this.createError('ffmpeg_load_failed', 'Failed to load FFmpeg', error);
    }
  }

  async convertToMP3(
    file: File,
    onProgress: (progress: ConversionProgress) => void
  ): Promise<ConversionResult> {
    if (!this.isReady) {
      await this.initialize();
    }

    if (!this.ffmpeg) {
      throw this.createError('ffmpeg_load_failed', 'FFmpeg not available');
    }

    const fileId = crypto.randomUUID();
    const startTime = Date.now();
    
    try {
      // Update progress: starting conversion
      onProgress({
        fileId,
        status: ConversionStatus.PROCESSING,
        progress: 0,
        currentStep: 'Preparing file for conversion...'
      });

      // Write input file to FFmpeg filesystem
      const inputName = `input_${fileId}.${this.getFileExtension(file.name)}`;
      const outputName = `output_${fileId}.mp3`;
      
      await this.ffmpeg.writeFile(inputName, await fetchFile(file));
      
      onProgress({
        fileId,
        status: ConversionStatus.PROCESSING,
        progress: 20,
        currentStep: 'Converting to MP3...'
      });

      // Set up progress monitoring
      this.setupProgressMonitoring(fileId, onProgress);

      // Execute FFmpeg command for MP3 conversion (128kbps)
      await this.ffmpeg.exec([
        '-i', inputName,
        '-codec:a', 'libmp3lame',
        '-b:a', '128k',
        '-ar', '44100',
        '-ac', '2',
        '-f', 'mp3',
        outputName
      ]);

      onProgress({
        fileId,
        status: ConversionStatus.PROCESSING,
        progress: 90,
        currentStep: 'Finalizing conversion...'
      });

      // Read the converted file
      const data = await this.ffmpeg.readFile(outputName) as Uint8Array;
      
      // Clean up temporary files
      await this.ffmpeg.deleteFile(inputName);
      await this.ffmpeg.deleteFile(outputName);

      const convertedFile = {
        id: crypto.randomUUID(),
        originalId: fileId,
        data,
        name: this.generateMP3Name(file.name),
        size: data.length
      };

      onProgress({
        fileId,
        status: ConversionStatus.COMPLETED,
        progress: 100,
        currentStep: 'Conversion completed!'
      });

      return {
        success: true,
        fileId,
        convertedFile,
        duration: Date.now() - startTime
      };

    } catch (error) {
      console.error('Conversion failed:', error);
      
      onProgress({
        fileId,
        status: ConversionStatus.ERROR,
        progress: 0,
        currentStep: 'Conversion failed'
      });

      return {
        success: false,
        fileId,
        error: this.createError('conversion_failed', 'Failed to convert file', error),
        duration: Date.now() - startTime
      };
    }
  }

  private setupProgressMonitoring(
    fileId: string, 
    onProgress: (progress: ConversionProgress) => void
  ): void {
    if (!this.ffmpeg) return;

    // FFmpeg progress monitoring through log messages
    this.ffmpeg.on('log', ({ type, message }) => {
      if (type === 'fferr') {
        // Parse FFmpeg progress from error stream
        const timeMatch = message.match(/time=(\d{2}):(\d{2}):(\d{2})/);
        if (timeMatch) {
          // This is a simplified progress calculation
          // In a real implementation, you'd need the total duration
          const progress = Math.min(70, 30 + Math.random() * 40);
          
          onProgress({
            fileId,
            status: ConversionStatus.PROCESSING,
            progress,
            currentStep: 'Converting audio stream...'
          });
        }
      }
    });
  }

  private getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || 'mp4';
  }

  private generateMP3Name(originalName: string): string {
    const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
    return `${nameWithoutExt}.mp3`;
  }

  private createError(
    type: ErrorType, 
    message: string, 
    details?: any
  ): ConversionError {
    return {
      type,
      message,
      details: details?.toString(),
      recoverable: type !== 'ffmpeg_load_failed'
    };
  }

  get ready(): boolean {
    return this.isReady;
  }

  get loading(): boolean {
    return this.isLoading;
  }

  async cleanup(): Promise<void> {
    if (this.ffmpeg) {
      try {
        await this.ffmpeg.terminate();
      } catch (error) {
        console.warn('Error terminating FFmpeg:', error);
      }
      this.ffmpeg = null;
    }
    this.isReady = false;
    this.isLoading = false;
  }
}