/**
 * FFmpeg.wasm service unified export
 * Selects normal version or Web Worker version based on environment
 */

import { FFmpegService } from './ffmpegService';
import { FFmpegWorkerService } from './ffmpegWorkerService';
import type {
  VideoFile,
  Mp3File,
  ConversionProgress
} from '../types';

/**
 * FFmpeg service interface
 */
export interface IFFmpegService {
  loadFFmpeg(onProgress?: (progress: ConversionProgress) => void): Promise<void>;
  convertToMp3(videoFile: VideoFile, onProgress?: (progress: ConversionProgress) => void): Promise<Mp3File>;
  terminate(): Promise<void>;
  isFFmpegLoaded(): boolean;
  isFFmpegLoading(): boolean;
}

/**
 * Determine Web Worker support
 */
const isWebWorkerSupported = (): boolean => {
  try {
    return typeof Worker !== 'undefined' && typeof window !== 'undefined';
  } catch {
    return false;
  }
};

/**
 * Select optimal FFmpeg service based on environment
 * @param useWorker Flag to force Web Worker usage (default: auto-detect)
 */
export function createFFmpegService(useWorker?: boolean): IFFmpegService {
  const shouldUseWorker = useWorker ?? isWebWorkerSupported();
  
  if (shouldUseWorker) {
    console.info('Using FFmpegWorkerService (via Web Worker)');
    return FFmpegWorkerService.getInstance();
  } else {
    console.info('Using FFmpegService (main thread)');
    return FFmpegService.getInstance();
  }
}

/**
 * Default FFmpeg service (auto-select)
 */
export const defaultFFmpegService = createFFmpegService();

// Export individual service classes
export { FFmpegService } from './ffmpegService';
export { FFmpegWorkerService } from './ffmpegWorkerService';