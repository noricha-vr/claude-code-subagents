import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';

export class FFmpegService {
  private ffmpeg: FFmpeg;
  private isLoaded: boolean = false;
  private isLoading: boolean = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
  }

  async load(onProgress?: (progress: number) => void): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading) {
      throw new Error('FFmpeg is already loading');
    }

    this.isLoading = true;

    try {
      // Set up progress callback
      if (onProgress) {
        this.ffmpeg.on('progress', ({ progress }) => {
          onProgress(Math.round(progress * 100));
        });
      }

      // Load FFmpeg core from CDN
      const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
      
      await this.ffmpeg.load({
        coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
        wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
        workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
      });

      this.isLoaded = true;
    } catch (error) {
      console.error('FFmpeg loading failed:', error);
      throw new Error(`Failed to load FFmpeg: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      this.isLoading = false;
    }
  }

  getFFmpeg(): FFmpeg {
    if (!this.isLoaded) {
      throw new Error('FFmpeg is not loaded. Call load() first.');
    }
    return this.ffmpeg;
  }

  isFFmpegLoaded(): boolean {
    return this.isLoaded;
  }

  isFFmpegLoading(): boolean {
    return this.isLoading;
  }
}

// Singleton instance
export const ffmpegService = new FFmpegService();