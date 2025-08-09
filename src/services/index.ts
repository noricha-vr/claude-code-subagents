/**
 * FFmpeg.wasmサービスの統一エクスポート
 * 通常版・Web Worker版を環境に応じて選択
 */

import { FFmpegService } from './ffmpegService';
import { FFmpegWorkerService } from './ffmpegWorkerService';
import type {
  VideoFile,
  Mp3File,
  ConversionProgress
} from '../types';

/**
 * FFmpegサービスのインターフェース
 */
export interface IFFmpegService {
  loadFFmpeg(onProgress?: (progress: ConversionProgress) => void): Promise<void>;
  convertToMp3(videoFile: VideoFile, onProgress?: (progress: ConversionProgress) => void): Promise<Mp3File>;
  terminate(): Promise<void>;
  isFFmpegLoaded(): boolean;
  isFFmpegLoading(): boolean;
}

/**
 * Web Worker使用可否の判定
 */
const isWebWorkerSupported = (): boolean => {
  try {
    return typeof Worker !== 'undefined' && typeof window !== 'undefined';
  } catch {
    return false;
  }
};

/**
 * 環境に応じた最適なFFmpegサービスを選択
 * @param useWorker Web Workerを強制使用するフラグ（デフォルト: 自動判定）
 */
export function createFFmpegService(useWorker?: boolean): IFFmpegService {
  const shouldUseWorker = useWorker ?? isWebWorkerSupported();
  
  if (shouldUseWorker) {
    console.info('FFmpegWorkerServiceを使用します（Web Worker経由）');
    return FFmpegWorkerService.getInstance();
  } else {
    console.info('FFmpegServiceを使用します（メインスレッド）');
    return FFmpegService.getInstance();
  }
}

/**
 * デフォルトFFmpegサービス（自動選択）
 */
export const defaultFFmpegService = createFFmpegService();

// 個別サービスクラスもエクスポート
export { FFmpegService } from './ffmpegService';
export { FFmpegWorkerService } from './ffmpegWorkerService';