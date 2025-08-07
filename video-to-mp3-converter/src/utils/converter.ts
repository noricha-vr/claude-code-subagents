import { FFmpegWorkerManager } from './ffmpegWorkerManager.js';
import type { 
  ConversionOptions, 
  ConversionResult, 
  ConversionProgress,
  FileUploadItem,
  BatchProgress,
  BatchConversionOptions,
  BatchConversionResult,
  ConversionError as IConversionError,
  ConversionErrorType as IConversionErrorType
} from '../types/index.js';

/**
 * エラー分類の定義
 */
export const ConversionErrorType = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  CONVERSION_ERROR: 'CONVERSION_ERROR',
  WORKER_ERROR: 'WORKER_ERROR',
  ABORT_ERROR: 'ABORT_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  MEMORY_ERROR: 'MEMORY_ERROR'
} as const;

export type ConversionErrorType = typeof ConversionErrorType[keyof typeof ConversionErrorType];

/**
 * 変換エラークラス
 */
export class ConversionError extends Error {
  public readonly type: ConversionErrorType;
  public readonly originalError?: Error;
  public readonly fileId?: string;

  constructor(
    type: ConversionErrorType,
    message: string,
    originalError?: Error,
    fileId?: string
  ) {
    super(message);
    this.name = 'ConversionError';
    this.type = type;
    this.originalError = originalError;
    this.fileId = fileId;
  }
}

/**
 * バッチ処理の進捗集約クラス
 */
export class BatchProgressAggregator {
  private fileProgresses = new Map<string, ConversionProgress>();
  private totalFiles: number = 0;
  private completedFiles: number = 0;
  private failedFiles: number = 0;
  private onUpdate?: (progress: BatchProgress) => void;

  constructor(fileIds: string[], onUpdate?: (progress: BatchProgress) => void) {
    this.totalFiles = fileIds.length;
    this.onUpdate = onUpdate;
    
    // 初期化
    fileIds.forEach(id => {
      this.fileProgresses.set(id, {
        fileId: id,
        percentage: 0,
        stage: 'initializing',
        timeRemaining: null,
        processedTime: null,
        totalTime: null,
        speed: null
      });
    });
  }

  /**
   * 個別ファイルの進捗を更新
   */
  updateFileProgress(fileId: string, progress: ConversionProgress): void {
    const currentProgress = this.fileProgresses.get(fileId);
    if (!currentProgress) return;

    this.fileProgresses.set(fileId, { ...progress, fileId });
    this.notifyUpdate();
  }

  /**
   * ファイル完了の通知
   */
  markFileComplete(fileId: string): void {
    this.completedFiles++;
    this.updateFileProgress(fileId, {
      fileId,
      percentage: 100,
      stage: 'completed',
      timeRemaining: 0,
      processedTime: null,
      totalTime: null,
      speed: null
    });
  }

  /**
   * ファイル失敗の通知
   */
  markFileFailed(fileId: string, error: ConversionError): void {
    this.failedFiles++;
    this.updateFileProgress(fileId, {
      fileId,
      percentage: 0,
      stage: 'error',
      timeRemaining: null,
      processedTime: null,
      totalTime: null,
      speed: null,
      error: error.message
    });
  }

  /**
   * 全体進捗の計算と通知
   */
  private notifyUpdate(): void {
    if (!this.onUpdate) return;

    const progresses = Array.from(this.fileProgresses.values());
    const overallPercentage = progresses.reduce((sum, p) => sum + p.percentage, 0) / this.totalFiles;
    
    const batchProgress: BatchProgress = {
      totalFiles: this.totalFiles,
      completedFiles: this.completedFiles,
      failedFiles: this.failedFiles,
      processingFiles: this.totalFiles - this.completedFiles - this.failedFiles,
      overallPercentage,
      fileProgresses: progresses,
      isComplete: this.completedFiles + this.failedFiles >= this.totalFiles,
      hasErrors: this.failedFiles > 0
    };

    this.onUpdate(batchProgress);
  }

  /**
   * 現在の全体進捗を取得
   */
  getBatchProgress(): BatchProgress {
    const progresses = Array.from(this.fileProgresses.values());
    const overallPercentage = progresses.reduce((sum, p) => sum + p.percentage, 0) / this.totalFiles;
    
    return {
      totalFiles: this.totalFiles,
      completedFiles: this.completedFiles,
      failedFiles: this.failedFiles,
      processingFiles: this.totalFiles - this.completedFiles - this.failedFiles,
      overallPercentage,
      fileProgresses: progresses,
      isComplete: this.completedFiles + this.failedFiles >= this.totalFiles,
      hasErrors: this.failedFiles > 0
    };
  }
}

/**
 * ビデオコンバーター - 高レベル変換API
 */
export class VideoConverter {
  private workerManager: FFmpegWorkerManager;
  private abortController?: AbortController;
  private isInitialized: boolean = false;

  constructor() {
    this.workerManager = FFmpegWorkerManager.getInstance();
  }

  /**
   * 初期化チェック
   */
  private async ensureInitialized(): Promise<void> {
    if (!this.isInitialized) {
      await this.workerManager.initialize();
      this.isInitialized = true;
    }
  }

  /**
   * 単一ファイルの変換
   */
  async convertFile(
    file: File,
    options: ConversionOptions = {},
    onProgress?: (progress: ConversionProgress) => void,
    signal?: AbortSignal
  ): Promise<ConversionResult> {
    const fileId = this.generateFileId(file);
    const startTime = performance.now();

    try {
      // 初期化チェック
      await this.ensureInitialized();

      // ファイル検証
      this.validateFile(file);

      // キャンセル状態のチェック
      if (signal?.aborted) {
        throw new ConversionError(
          ConversionErrorType.ABORT_ERROR,
          'Conversion was aborted before starting',
          undefined,
          fileId
        );
      }

      // 進捗コールバックの準備
      const progressCallback = (progress: ConversionProgress) => {
        // 進捗にfileIdを追加
        const updatedProgress = { ...progress, fileId };
        onProgress?.(updatedProgress);
      };

      // 変換実行
      const convertedData = await this.workerManager.convert(
        file,
        options,
        progressCallback,
        signal
      );

      const endTime = performance.now();
      const processingTime = (endTime - startTime) / 1000; // 秒

      // 成功結果の構築
      const result: ConversionResult = {
        fileId,
        originalFile: file,
        convertedData,
        success: true,
        processingTime,
        outputFormat: options.format || 'mp3',
        bitrate: options.bitrate || 128,
        timestamp: new Date().toISOString()
      };

      return result;

    } catch (error) {
      // エラーの分類と包装
      const conversionError = this.classifyError(error, fileId);
      
      const result: ConversionResult = {
        fileId,
        originalFile: file,
        convertedData: null,
        success: false,
        error: conversionError as IConversionError,
        processingTime: (performance.now() - startTime) / 1000,
        outputFormat: options.format || 'mp3',
        bitrate: options.bitrate || 128,
        timestamp: new Date().toISOString()
      };

      return result;
    }
  }

  /**
   * 複数ファイルのバッチ変換（順次処理）
   */
  async convertBatch(
    files: File[],
    options: BatchConversionOptions = {},
    onProgress?: (progress: BatchProgress) => void,
    signal?: AbortSignal
  ): Promise<BatchConversionResult> {
    const startTime = performance.now();
    const fileIds = files.map(file => this.generateFileId(file));
    
    // プログレス集約器の初期化
    const progressAggregator = new BatchProgressAggregator(fileIds, onProgress);
    
    const results: ConversionResult[] = [];
    let aborted = false;

    try {
      // 初期化チェック
      await this.ensureInitialized();

      // 順次処理モードでの変換
      if (options.mode === 'sequential' || !options.mode) {
        for (const file of files) {
          if (signal?.aborted) {
            aborted = true;
            break;
          }

          const fileId = this.generateFileId(file);
          
          try {
            const result = await this.convertFile(
              file,
              options.conversionOptions,
              (progress) => progressAggregator.updateFileProgress(fileId, progress),
              signal
            );
            
            results.push(result);
            
            if (result.success) {
              progressAggregator.markFileComplete(fileId);
            } else if (result.error) {
              progressAggregator.markFileFailed(fileId, result.error as ConversionError);
            }
          } catch (error) {
            const conversionError = this.classifyError(error, fileId);
            progressAggregator.markFileFailed(fileId, conversionError);
            
            // 個別ファイルエラーは結果に含めて処理続行
            results.push({
              fileId,
              originalFile: file,
              convertedData: null,
              success: false,
              error: conversionError as IConversionError,
              processingTime: 0,
              outputFormat: options.conversionOptions?.format || 'mp3',
              bitrate: options.conversionOptions?.bitrate || 128,
              timestamp: new Date().toISOString()
            });
          }
        }
      }

      const endTime = performance.now();
      const totalProcessingTime = (endTime - startTime) / 1000;

      // バッチ結果の構築
      const batchResult: BatchConversionResult = {
        results,
        totalFiles: files.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        totalProcessingTime,
        aborted,
        timestamp: new Date().toISOString(),
        finalProgress: progressAggregator.getBatchProgress()
      };

      return batchResult;

    } catch (error) {
      // バッチ全体のエラー
      const conversionError = this.classifyError(error);
      
      const batchResult: BatchConversionResult = {
        results,
        totalFiles: files.length,
        successCount: results.filter(r => r.success).length,
        failureCount: results.filter(r => !r.success).length,
        totalProcessingTime: (performance.now() - startTime) / 1000,
        aborted: true,
        error: conversionError as IConversionError,
        timestamp: new Date().toISOString(),
        finalProgress: progressAggregator.getBatchProgress()
      };

      return batchResult;
    }
  }

  /**
   * 複数ファイルの並列変換（将来の拡張用）
   * 注意: 現在のFFmpeg.wasmは同時実行に制限があるため、順次処理を推奨
   */
  async convertBatchParallel(
    files: File[],
    options: BatchConversionOptions = {},
    onProgress?: (progress: BatchProgress) => void,
    signal?: AbortSignal
  ): Promise<BatchConversionResult> {
    // 現在は順次処理にフォールバック
    console.warn('Parallel conversion is not yet supported. Using sequential processing.');
    return this.convertBatch(files, {
      ...options,
      mode: 'sequential'
    }, onProgress, signal);
  }

  /**
   * 変換のキャンセル
   */
  cancel(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = undefined;
    }
  }

  /**
   * リソースのクリーンアップ
   */
  async cleanup(): Promise<void> {
    this.cancel();
    await this.workerManager.destroy();
    this.isInitialized = false;
  }

  /**
   * ファイル検証
   */
  private validateFile(file: File): void {
    // ファイルサイズチェック (500MB)
    const MAX_FILE_SIZE = 500 * 1024 * 1024;
    if (file.size > MAX_FILE_SIZE) {
      throw new ConversionError(
        ConversionErrorType.VALIDATION_ERROR,
        `File size too large: ${this.formatFileSize(file.size)}. Maximum allowed: ${this.formatFileSize(MAX_FILE_SIZE)}`
      );
    }

    // MIMEタイプチェック
    const supportedMimeTypes = [
      'video/mp4', 'video/webm', 'video/ogg', 'video/avi',
      'video/mov', 'video/quicktime', 'video/x-msvideo',
      'video/mkv', 'video/x-matroska', 'video/3gpp', 'video/x-flv'
    ];

    if (!supportedMimeTypes.includes(file.type)) {
      throw new ConversionError(
        ConversionErrorType.VALIDATION_ERROR,
        `Unsupported file format: ${file.type}. Supported formats: ${supportedMimeTypes.join(', ')}`
      );
    }
  }

  /**
   * エラーの分類
   */
  private classifyError(error: unknown, fileId?: string): ConversionError {
    if (error instanceof ConversionError) {
      return error;
    }

    if (error instanceof Error) {
      // AbortErrorの検出
      if (error.name === 'AbortError' || error.message.includes('aborted')) {
        return new ConversionError(
          ConversionErrorType.ABORT_ERROR,
          'Conversion was cancelled by user',
          error,
          fileId
        );
      }

      // タイムアウトエラーの検出
      if (error.message.includes('timeout')) {
        return new ConversionError(
          ConversionErrorType.TIMEOUT_ERROR,
          'Conversion timed out',
          error,
          fileId
        );
      }

      // メモリエラーの検出
      if (error.message.includes('memory') || error.message.includes('Memory')) {
        return new ConversionError(
          ConversionErrorType.MEMORY_ERROR,
          'Out of memory during conversion',
          error,
          fileId
        );
      }

      // Worker関連エラー
      if (error.message.includes('Worker') || error.message.includes('worker')) {
        return new ConversionError(
          ConversionErrorType.WORKER_ERROR,
          'Worker communication error',
          error,
          fileId
        );
      }

      // 変換エラー
      return new ConversionError(
        ConversionErrorType.CONVERSION_ERROR,
        error.message,
        error,
        fileId
      );
    }

    // 未知のエラー
    return new ConversionError(
      ConversionErrorType.CONVERSION_ERROR,
      'Unknown conversion error occurred',
      error as Error,
      fileId
    );
  }

  /**
   * ファイルIDの生成
   */
  private generateFileId(file: File): string {
    return `${file.name}-${file.size}-${file.lastModified}`;
  }

  /**
   * ファイルサイズのフォーマット
   */
  private formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

/**
 * シングルトンインスタンス
 */
let converterInstance: VideoConverter | null = null;

/**
 * VideoConverterのシングルトンインスタンスを取得
 */
export function getVideoConverter(): VideoConverter {
  if (!converterInstance) {
    converterInstance = new VideoConverter();
  }
  return converterInstance;
}

/**
 * 便利関数: 単一ファイル変換
 */
export async function convertVideoToMp3(
  file: File,
  options?: ConversionOptions,
  onProgress?: (progress: ConversionProgress) => void,
  signal?: AbortSignal
): Promise<ConversionResult> {
  const converter = getVideoConverter();
  return converter.convertFile(file, options, onProgress, signal);
}

/**
 * 便利関数: バッチ変換
 */
export async function convertMultipleVideos(
  files: File[],
  options?: BatchConversionOptions,
  onProgress?: (progress: BatchProgress) => void,
  signal?: AbortSignal
): Promise<BatchConversionResult> {
  const converter = getVideoConverter();
  return converter.convertBatch(files, options, onProgress, signal);
}

/**
 * 便利関数: FileUploadItemからFile配列を抽出
 */
export function extractFilesFromUploadItems(items: FileUploadItem[]): File[] {
  return items.map(item => item.file);
}

/**
 * 便利関数: 変換結果の統計情報を取得
 */
export function getConversionStats(results: ConversionResult[]): {
  totalFiles: number;
  successRate: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  totalDataSize: number;
  errorsByType: Record<IConversionErrorType, number>;
} {
  const totalFiles = results.length;
  const successful = results.filter(r => r.success);
  const successRate = totalFiles > 0 ? (successful.length / totalFiles) * 100 : 0;
  
  const totalProcessingTime = results.reduce((sum, r) => sum + r.processingTime, 0);
  const averageProcessingTime = totalFiles > 0 ? totalProcessingTime / totalFiles : 0;
  
  const totalDataSize = successful.reduce((sum, r) => {
    return sum + (r.convertedData?.byteLength || 0);
  }, 0);

  const errorsByType: Record<IConversionErrorType, number> = {
    [ConversionErrorType.VALIDATION_ERROR]: 0,
    [ConversionErrorType.CONVERSION_ERROR]: 0,
    [ConversionErrorType.WORKER_ERROR]: 0,
    [ConversionErrorType.ABORT_ERROR]: 0,
    [ConversionErrorType.TIMEOUT_ERROR]: 0,
    [ConversionErrorType.MEMORY_ERROR]: 0
  };

  results.forEach(r => {
    if (!r.success && r.error) {
      const errorType = r.error.type as IConversionErrorType;
      if (errorType in errorsByType) {
        errorsByType[errorType]++;
      }
    }
  });

  return {
    totalFiles,
    successRate,
    totalProcessingTime,
    averageProcessingTime,
    totalDataSize,
    errorsByType
  };
}