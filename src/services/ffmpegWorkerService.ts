/**
 * FFmpeg.wasm Web Workerサービス
 * Web Worker経由での動画→MP3変換処理
 */

import type {
  VideoFile,
  Mp3File,
  ConversionProgress,
  AppError
} from '../types';

interface WorkerMessage {
  type: 'LOAD' | 'CONVERT' | 'TERMINATE';
  payload?: any;
}

interface WorkerResponse {
  type: 'PROGRESS' | 'SUCCESS' | 'ERROR';
  payload?: any;
}

/**
 * Web Worker版FFmpegサービス
 */
export class FFmpegWorkerService {
  private static instance: FFmpegWorkerService | null = null;
  private worker: Worker | null = null;
  private isLoaded = false;
  private isLoading = false;

  private constructor() {}

  /**
   * サービスインスタンスを取得（シングルトン）
   */
  public static getInstance(): FFmpegWorkerService {
    if (!FFmpegWorkerService.instance) {
      FFmpegWorkerService.instance = new FFmpegWorkerService();
    }
    return FFmpegWorkerService.instance;
  }

  /**
   * Web Workerを初期化
   */
  private initializeWorker(): void {
    if (this.worker) {
      return;
    }

    // Web Workerファイルを動的にインポート
    this.worker = new Worker(
      new URL('./ffmpegWorker.ts', import.meta.url),
      {
        type: 'module'
      }
    );
  }

  /**
   * FFmpeg.wasmの読み込み（Web Worker経由）
   */
  public async loadFFmpeg(
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<void> {
    if (this.isLoaded) return;
    if (this.isLoading) {
      throw new Error('FFmpeg.wasmは既に読み込み中です');
    }

    return new Promise((resolve, reject) => {
      this.isLoading = true;
      this.initializeWorker();

      if (!this.worker) {
        this.isLoading = false;
        reject(new Error('Web Workerの初期化に失敗しました'));
        return;
      }

      // レスポンス処理
      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'PROGRESS':
            onProgress?.(payload);
            break;

          case 'SUCCESS':
            this.isLoaded = true;
            this.isLoading = false;
            this.worker?.removeEventListener('message', handleMessage);
            this.worker?.removeEventListener('error', handleError);
            resolve();
            break;

          case 'ERROR':
            this.isLoading = false;
            this.worker?.removeEventListener('message', handleMessage);
            this.worker?.removeEventListener('error', handleError);
            const error: AppError = {
              code: payload.code || 'WORKER_ERROR',
              message: payload.message || 'Web Workerエラー',
              details: payload.details,
              timestamp: payload.timestamp || Date.now()
            };
            reject(error);
            break;
        }
      };

      const handleError = (error: ErrorEvent) => {
        this.isLoading = false;
        this.worker?.removeEventListener('message', handleMessage);
        this.worker?.removeEventListener('error', handleError);
        reject(new Error(`Web Workerエラー: ${error.message}`));
      };

      this.worker.addEventListener('message', handleMessage);
      this.worker.addEventListener('error', handleError);

      // Web Workerに読み込み指示を送信
      this.postMessage({ type: 'LOAD' });
    });
  }

  /**
   * 動画ファイルをMP3に変換（Web Worker経由）
   */
  public async convertToMp3(
    videoFile: VideoFile,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<Mp3File> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg.wasmが読み込まれていません');
    }

    if (!this.worker) {
      throw new Error('Web Workerが初期化されていません');
    }

    return new Promise(async (resolve, reject) => {
      // VideoFileをArrayBufferに変換
      const arrayBuffer = await videoFile.file.arrayBuffer();
      
      const conversionRequest = {
        videoFile: {
          name: videoFile.name,
          size: videoFile.size,
          type: videoFile.type,
          duration: videoFile.duration,
          arrayBuffer
        }
      };

      // レスポンス処理
      const handleMessage = (event: MessageEvent<WorkerResponse>) => {
        const { type, payload } = event.data;

        switch (type) {
          case 'PROGRESS':
            onProgress?.(payload);
            break;

          case 'SUCCESS':
            this.worker?.removeEventListener('message', handleMessage);
            this.worker?.removeEventListener('error', handleError);
            
            // ArrayBufferからBlobを作成してオブジェクトURLを生成
            const mp3Blob = new Blob([payload.arrayBuffer], { type: 'audio/mpeg' });
            const mp3Url = URL.createObjectURL(mp3Blob);

            const mp3File: Mp3File = {
              name: payload.name,
              size: payload.size,
              url: mp3Url,
              bitrate: payload.bitrate,
              duration: payload.duration
            };

            resolve(mp3File);
            break;

          case 'ERROR':
            this.worker?.removeEventListener('message', handleMessage);
            this.worker?.removeEventListener('error', handleError);
            const error: AppError = {
              code: payload.code || 'CONVERSION_ERROR',
              message: payload.message || '変換エラー',
              details: payload.details,
              timestamp: payload.timestamp || Date.now()
            };
            reject(error);
            break;
        }
      };

      const handleError = (error: ErrorEvent) => {
        this.worker?.removeEventListener('message', handleMessage);
        this.worker?.removeEventListener('error', handleError);
        reject(new Error(`Web Workerエラー: ${error.message}`));
      };

      this.worker!.addEventListener('message', handleMessage);
      this.worker!.addEventListener('error', handleError);

      // Web Workerに変換指示を送信
      this.postMessage({
        type: 'CONVERT',
        payload: conversionRequest
      });
    });
  }

  /**
   * Web Workerを終了
   */
  public async terminate(): Promise<void> {
    if (this.worker) {
      this.postMessage({ type: 'TERMINATE' });
      this.worker.terminate();
      this.worker = null;
      this.isLoaded = false;
      this.isLoading = false;
    }
  }

  /**
   * Web WorkerにメッセージをポストするHelper
   */
  private postMessage(message: WorkerMessage): void {
    if (this.worker) {
      this.worker.postMessage(message);
    }
  }

  /**
   * FFmpegが読み込み済みかどうかチェック
   */
  public isFFmpegLoaded(): boolean {
    return this.isLoaded;
  }

  /**
   * FFmpegの読み込み中かどうかチェック
   */
  public isFFmpegLoading(): boolean {
    return this.isLoading;
  }
}

/**
 * デフォルトエクスポート（シングルトンインスタンス）
 */
export default FFmpegWorkerService.getInstance();