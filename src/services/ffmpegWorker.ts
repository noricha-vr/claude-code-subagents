/**
 * FFmpeg.wasm Web Worker
 * バックグラウンドでの動画→MP3変換処理
 * メインスレッドのブロッキングを防ぐ
 */

import { FFmpeg } from '@ffmpeg/ffmpeg';
import { toBlobURL } from '@ffmpeg/util';
import {
  FFMPEG_CDN,
  DEFAULT_MP3_CONFIG,
  ERROR_MESSAGES,
  CONVERSION_STEPS,
  generateMp3Filename
} from '../utils/constants';

// Web Worker内で使用する型定義
interface WorkerMessage {
  type: 'LOAD' | 'CONVERT' | 'TERMINATE';
  payload?: any;
}

interface WorkerResponse {
  type: 'PROGRESS' | 'SUCCESS' | 'ERROR';
  payload?: any;
}

interface ConversionRequest {
  videoFile: {
    name: string;
    size: number;
    type: string;
    duration?: number;
    arrayBuffer: ArrayBuffer;
  };
}

class FFmpegWorker {
  private ffmpeg: FFmpeg | null = null;
  private isLoaded = false;

  constructor() {
    this.ffmpeg = new FFmpeg();
    this.setupMessageHandler();
  }

  private setupMessageHandler(): void {
    self.addEventListener('message', async (event: MessageEvent<WorkerMessage>) => {
      const { type, payload } = event.data;

      try {
        switch (type) {
          case 'LOAD':
            await this.loadFFmpeg();
            break;
          case 'CONVERT':
            await this.convertToMp3(payload as ConversionRequest);
            break;
          case 'TERMINATE':
            await this.terminate();
            break;
          default:
            this.postError('UNKNOWN_MESSAGE', `未知のメッセージタイプ: ${type}`);
        }
      } catch (error) {
        this.postError(
          'WORKER_ERROR',
          error instanceof Error ? error.message : 'Unknown worker error'
        );
      }
    });
  }

  private postMessage(response: WorkerResponse): void {
    self.postMessage(response);
  }

  private postProgress(percentage: number, currentStep: string, startTime: number, estimatedTimeLeft?: number): void {
    this.postMessage({
      type: 'PROGRESS',
      payload: {
        percentage,
        currentStep,
        startTime,
        estimatedTimeLeft
      }
    });
  }

  private postSuccess(data: any): void {
    this.postMessage({
      type: 'SUCCESS',
      payload: data
    });
  }

  private postError(code: string, message: string, details?: string): void {
    this.postMessage({
      type: 'ERROR',
      payload: {
        code,
        message,
        details,
        timestamp: Date.now()
      }
    });
  }

  private checkEnvironment(): void {
    if (!crossOriginIsolated) {
      throw new Error(ERROR_MESSAGES.CROSS_ORIGIN_ISOLATION_REQUIRED);
    }

    if (typeof SharedArrayBuffer === 'undefined') {
      throw new Error(ERROR_MESSAGES.SHARED_ARRAY_BUFFER_UNAVAILABLE);
    }
  }

  private async loadFFmpeg(): Promise<void> {
    if (this.isLoaded) {
      this.postSuccess({ loaded: true });
      return;
    }

    try {
      this.checkEnvironment();

      if (!this.ffmpeg) {
        throw new Error('FFmpegインスタンスの作成に失敗しました');
      }

      this.postProgress(10, CONVERSION_STEPS.INITIALIZING, Date.now());

      // CDN URLをBlobに変換
      const coreURL = await toBlobURL(
        FFMPEG_CDN.CORE_URL,
        'text/javascript'
      );
      const wasmURL = await toBlobURL(
        FFMPEG_CDN.WASM_URL,
        'application/wasm'
      );

      this.postProgress(50, 'FFmpegコアファイルを読み込み中...', Date.now());

      // FFmpegをロード
      await this.ffmpeg.load({
        coreURL,
        wasmURL,
        workerURL: FFMPEG_CDN.WORKER_URL
      });

      this.isLoaded = true;

      this.postProgress(100, 'FFmpeg.wasm読み込み完了', Date.now());
      this.postSuccess({ loaded: true });

    } catch (error) {
      this.postError(
        'FFMPEG_LOAD_ERROR',
        ERROR_MESSAGES.FFMPEG_LOAD_FAILED,
        error instanceof Error ? error.message : 'Unknown load error'
      );
    }
  }

  private async convertToMp3(request: ConversionRequest): Promise<void> {
    if (!this.isLoaded || !this.ffmpeg) {
      this.postError('FFMPEG_NOT_LOADED', 'FFmpeg.wasmが読み込まれていません');
      return;
    }

    const { videoFile } = request;
    const startTime = Date.now();
    const inputFileName = 'input_video';
    const outputFileName = 'output.mp3';

    try {
      this.postProgress(0, CONVERSION_STEPS.LOADING_FILE, startTime);

      // ArrayBufferからUint8Arrayを作成
      const videoData = new Uint8Array(videoFile.arrayBuffer);
      
      // 動画ファイルをFFmpegのファイルシステムに書き込み
      await this.ffmpeg.writeFile(inputFileName, videoData);

      this.postProgress(20, CONVERSION_STEPS.CONVERTING, startTime);

      // プログレス監視の設定
      let lastProgressTime = Date.now();
      this.ffmpeg.on('progress', ({ progress, time }) => {
        const now = Date.now();
        // 進捗通知を適度に制限（100ms以上の間隔）
        if (now - lastProgressTime >= 100) {
          const percentage = Math.min(Math.max(progress * 80 + 20, 20), 95);
          const estimatedDuration = videoFile.duration || 0;
          const processedDuration = time / 1000000; // マイクロ秒を秒に変換
          
          let estimatedTimeLeft: number | undefined;
          if (estimatedDuration > 0 && processedDuration > 0) {
            const processingSpeed = processedDuration / ((now - startTime) / 1000);
            estimatedTimeLeft = ((estimatedDuration - processedDuration) / processingSpeed) * 1000;
          }

          this.postProgress(
            percentage,
            `変換中... ${Math.round(processedDuration)}s / ${Math.round(estimatedDuration)}s`,
            startTime,
            estimatedTimeLeft
          );

          lastProgressTime = now;
        }
      });

      // MP3変換実行
      await this.ffmpeg.exec([
        '-i', inputFileName,
        '-vn', // 動画ストリームを除外
        '-ar', DEFAULT_MP3_CONFIG.SAMPLE_RATE.toString(),
        '-ac', DEFAULT_MP3_CONFIG.CHANNELS.toString(),
        '-b:a', `${DEFAULT_MP3_CONFIG.BITRATE}k`,
        '-f', 'mp3',
        outputFileName
      ]);

      this.postProgress(95, CONVERSION_STEPS.FINALIZING, startTime);

      // 変換結果を読み込み
      const mp3Data = await this.ffmpeg.readFile(outputFileName);
      
      if (!(mp3Data instanceof Uint8Array)) {
        throw new Error('変換結果の読み込みに失敗しました');
      }

      // MP3ファイル情報を作成（ArrayBufferとして送信）
      const mp3File = {
        name: generateMp3Filename(videoFile.name),
        size: mp3Data.length,
        arrayBuffer: mp3Data.buffer.slice(mp3Data.byteOffset, mp3Data.byteOffset + mp3Data.byteLength),
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

      this.postProgress(100, CONVERSION_STEPS.COMPLETED, startTime);
      this.postSuccess(mp3File);

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

      this.postError(
        'CONVERSION_ERROR',
        ERROR_MESSAGES.CONVERSION_FAILED,
        error instanceof Error ? error.message : 'Unknown conversion error'
      );
    }
  }

  private async terminate(): Promise<void> {
    if (this.ffmpeg && this.isLoaded) {
      await this.ffmpeg.terminate();
      this.isLoaded = false;
    }
    self.close();
  }
}

// Web Worker を初期化
new FFmpegWorker();