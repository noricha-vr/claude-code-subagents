/**
 * FFmpeg.wasmサービス
 * 動画ファイル→MP3変換処理を担当
 * Chrome専用・SharedArrayBuffer・Cross-Origin Isolation環境
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';
import type {
  VideoFile,
  Mp3File,
  ConversionProgress,
  AppError
} from '../types';
import {
  FFMPEG_CDN,
  DEFAULT_MP3_CONFIG,
  ERROR_MESSAGES,
  CONVERSION_STEPS,
  generateMp3Filename
} from '../utils/constants';

/**
 * FFmpeg.wasmサービスクラス
 * シングルトンパターンで実装
 */
export class FFmpegService {
  private static instance: FFmpegService | null = null;
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;
  private isLoading = false;
  private loadPromise: Promise<void> | null = null;
  private lastProgressUpdate = 0;
  private readonly PROGRESS_THROTTLE_MS = 100;

  private constructor() {
    this.ffmpeg = new FFmpeg();
  }

  /**
   * サービスインスタンスを取得（シングルトン）
   */
  public static getInstance(): FFmpegService {
    if (!FFmpegService.instance) {
      FFmpegService.instance = new FFmpegService();
    }
    return FFmpegService.instance;
  }

  /**
   * 環境チェック
   * SharedArrayBufferとCross-Origin Isolationの確認
   */
  private checkEnvironment(): void {
    if (!crossOriginIsolated) {
      throw new Error(ERROR_MESSAGES.CROSS_ORIGIN_ISOLATION_REQUIRED);
    }

    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error(ERROR_MESSAGES.SHARED_ARRAY_BUFFER_UNAVAILABLE);
    }
  }

  /**
   * FFmpeg.wasmの読み込みと初期化
   * パフォーマンス最適化：重複読み込み防止とプロミス再利用
   */
  public async loadFFmpeg(
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<void> {
    if (this.isLoaded) return;
    
    // 既に読み込み中の場合は同じプロミスを返す
    if (this.isLoading && this.loadPromise) {
      return this.loadPromise;
    }

    // 読み込みプロミスを作成・保存
    this.loadPromise = this._performLoad(onProgress);
    return this.loadPromise;
  }

  /**
   * 実際の読み込み処理（内部メソッド）
   */
  private async _performLoad(
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<void> {
    try {
      this.isLoading = true;

      // 環境チェック
      this.checkEnvironment();

      if (!this.ffmpeg) {
        throw new Error('FFmpegインスタンスの作成に失敗しました');
      }

      // 進捗通知
      onProgress?.({
        percentage: 10,
        currentStep: CONVERSION_STEPS.INITIALIZING,
        startTime: Date.now()
      });

      // CDN URLをBlobに変換（CORS回避）
      const coreURL = await toBlobURL(
        FFMPEG_CDN.CORE_URL,
        'text/javascript'
      );
      const wasmURL = await toBlobURL(
        FFMPEG_CDN.WASM_URL,
        'application/wasm'
      );

      onProgress?.({
        percentage: 50,
        currentStep: 'FFmpegコアファイルを読み込み中...',
        startTime: Date.now()
      });

      // FFmpegをロード
      await this.ffmpeg.load({
        coreURL,
        wasmURL,
        workerURL: FFMPEG_CDN.WORKER_URL
      });

      this.isLoaded = true;

      onProgress?.({
        percentage: 100,
        currentStep: 'FFmpeg.wasm読み込み完了',
        startTime: Date.now()
      });

    } catch (error) {
      this.isLoading = false;
      const appError: AppError = {
        code: 'FFMPEG_LOAD_ERROR',
        message: ERROR_MESSAGES.FFMPEG_LOAD_FAILED,
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: Date.now(),
        stack: error instanceof Error ? error.stack : undefined
      };
      throw appError;
    } finally {
      this.isLoading = false;
      this.loadPromise = null;
    }
  }

  /**
   * 動画ファイルをMP3に変換
   */
  public async convertToMp3(
    videoFile: VideoFile,
    onProgress?: (progress: ConversionProgress) => void
  ): Promise<Mp3File> {
    if (!this.isLoaded) {
      throw new Error('FFmpeg.wasmが読み込まれていません');
    }

    if (!this.ffmpeg) {
      throw new Error('FFmpegインスタンスが利用できません');
    }

    const startTime = Date.now();
    const inputFileName = 'input_video';
    const outputFileName = 'output.mp3';

    try {
      // メモリ使用量監視（開始時）
      this._logMemoryUsage('conversion start');

      // 進捗通知: ファイル読み込み開始
      onProgress?.({
        percentage: 0,
        currentStep: CONVERSION_STEPS.LOADING_FILE,
        startTime
      });

      // 動画ファイルをFFmpegのファイルシステムに書き込み
      await this.ffmpeg.writeFile(
        inputFileName,
        await fetchFile(videoFile.file)
      );

      onProgress?.({
        percentage: 20,
        currentStep: CONVERSION_STEPS.CONVERTING,
        startTime
      });

      // プログレス監視の設定（最適化：スロットリング強化）
      this.ffmpeg.on('progress', ({ progress, time }) => {
        const now = Date.now();
        // 進捗通知を適度に制限（スロットリング）
        if (now - this.lastProgressUpdate >= this.PROGRESS_THROTTLE_MS) {
          const percentage = Math.min(Math.max(progress * 80 + 20, 20), 95);
          const estimatedDuration = videoFile.duration || 0;
          const processedDuration = time / 1000000; // マイクロ秒を秒に変換
          
          let estimatedTimeLeft: number | undefined;
          if (estimatedDuration > 0 && processedDuration > 0) {
            const processingSpeed = processedDuration / ((now - startTime) / 1000);
            estimatedTimeLeft = ((estimatedDuration - processedDuration) / processingSpeed) * 1000;
          }

          onProgress?.({
            percentage,
            currentStep: `変換中... ${Math.round(processedDuration)}s / ${Math.round(estimatedDuration)}s`,
            startTime,
            estimatedTimeLeft
          });

          this.lastProgressUpdate = now;
        }
      });

      // MP3変換実行（128kbps固定）
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-vn', // 動画ストリームを除外
        '-ar', DEFAULT_MP3_CONFIG.SAMPLE_RATE.toString(), // サンプルレート
        '-ac', DEFAULT_MP3_CONFIG.CHANNELS.toString(), // チャンネル数
        '-b:a', `${DEFAULT_MP3_CONFIG.BITRATE}k`, // ビットレート
        '-f', 'mp3', // 出力フォーマット
        outputFileName
      ]);

      onProgress?.({
        percentage: 95,
        currentStep: CONVERSION_STEPS.FINALIZING,
        startTime
      });

      // 変換結果を読み込み
      const mp3Data = await this.ffmpeg.readFile(outputFileName);
      
      if (!(mp3Data instanceof Uint8Array)) {
        throw new Error('変換結果の読み込みに失敗しました');
      }

      // Blobを作成してオブジェクトURLを生成（SharedArrayBuffer対応）
      // メモリ最適化：効率的なコピー処理
      const mp3Blob = this._createOptimizedBlob(mp3Data);
      const mp3Url = URL.createObjectURL(mp3Blob);

      // MP3ファイル情報を作成
      const mp3File: Mp3File = {
        name: generateMp3Filename(videoFile.name),
        size: mp3Blob.size,
        url: mp3Url,
        bitrate: DEFAULT_MP3_CONFIG.BITRATE,
        duration: videoFile.duration || 0
      };

      // 一時ファイルを削除
      try {
        await this.ffmpeg.deleteFile(inputFileName);
        await this.ffmpeg.deleteFile(outputFileName);
      } catch (deleteError) {
        console.warn('一時ファイルの削除に失敗:', deleteError);
      }

      onProgress?.({
        percentage: 100,
        currentStep: CONVERSION_STEPS.COMPLETED,
        startTime
      });

      // メモリ使用量監視（完了時）
      this._logMemoryUsage('conversion complete');

      return mp3File;

    } catch (error) {
      // エラー時の一時ファイルクリーンアップ
      try {
        if (this.ffmpeg) {
          await this.ffmpeg.deleteFile(inputFileName).catch(() => {});
          await this.ffmpeg.deleteFile(outputFileName).catch(() => {});
        }
      } catch {
        // クリーンアップエラーは無視
      }

      const appError: AppError = {
        code: 'CONVERSION_ERROR',
        message: ERROR_MESSAGES.CONVERSION_FAILED,
        details: error instanceof Error ? error.message : 'Unknown conversion error',
        timestamp: Date.now(),
        stack: error instanceof Error ? error.stack : undefined
      };
      throw appError;
    }
  }

  /**
   * FFmpegインスタンスを終了（メモリ解放）
   */
  public async terminate(): Promise<void> {
    if (this.ffmpeg && this.isLoaded) {
      await this.ffmpeg.terminate();
      this.isLoaded = false;
      this.isLoading = false;
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

  /**
   * メモリ最適化されたBlob作成
   */
  private _createOptimizedBlob(data: Uint8Array): Blob {
    // SharedArrayBufferの場合は新しいArrayBufferを作成してデータをコピー
    if (data.buffer instanceof SharedArrayBuffer) {
      const normalBuffer = new ArrayBuffer(data.length);
      const normalView = new Uint8Array(normalBuffer);
      normalView.set(data);
      return new Blob([normalBuffer], { type: 'audio/mpeg' });
    } else {
      // 通常のArrayBufferの場合はそのまま使用
      return new Blob([data.buffer], { type: 'audio/mpeg' });
    }
  }

  /**
   * メモリ使用状況の監視（開発環境のみ）
   */
  private _logMemoryUsage(context: string): void {
    if (process.env.NODE_ENV === 'development' && 'memory' in performance) {
      const memInfo = (performance as any).memory;
      console.log(`[FFmpegService] Memory usage at ${context}:`, {
        used: Math.round(memInfo.usedJSHeapSize / 1024 / 1024) + 'MB',
        total: Math.round(memInfo.totalJSHeapSize / 1024 / 1024) + 'MB',
        limit: Math.round(memInfo.jsHeapSizeLimit / 1024 / 1024) + 'MB'
      });
    }
  }
}

/**
 * デフォルトエクスポート（シングルトンインスタンス）
 */
export default FFmpegService.getInstance();