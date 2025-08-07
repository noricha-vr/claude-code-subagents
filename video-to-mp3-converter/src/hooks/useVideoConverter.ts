import { useState, useCallback, useRef, useEffect } from 'react';
import { 
  VideoConverter, 
  ConversionErrorType,
  getVideoConverter,
  extractFilesFromUploadItems,
  getConversionStats
} from '../utils/converter.js';
import type {
  ConversionOptions,
  ConversionResult,
  ConversionProgress,
  BatchProgress,
  BatchConversionOptions,
  BatchConversionResult,
  FileUploadItem
} from '../types/index.js';
import { useConversionErrorHandler } from './useErrorHandler';
import { AppError } from '../utils/errorUtils';

/**
 * 変換状態の定義
 */
export interface ConversionState {
  isInitialized: boolean;
  isInitializing: boolean;
  isConverting: boolean;
  currentFile: string | null;
  progress: BatchProgress | null;
  results: ConversionResult[];
  error: string | null;
}

/**
 * 変換統計情報
 */
export interface ConversionStats {
  totalFiles: number;
  successRate: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  totalDataSize: number;
  errorsByType: Record<ConversionErrorType, number>;
}

/**
 * useVideoConverter hook オプション
 */
export interface UseVideoConverterOptions {
  autoInitialize?: boolean;
  defaultOptions?: ConversionOptions;
  onInitialized?: () => void;
  onInitError?: (error: string) => void;
  onConversionStart?: (fileId: string) => void;
  onConversionComplete?: (result: ConversionResult) => void;
  onBatchComplete?: (results: BatchConversionResult) => void;
  onError?: (error: string, fileId?: string) => void;
}

/**
 * 動画変換フック
 * 
 * VideoConverterクラスをReact環境で使いやすくするためのフック
 * 状態管理、エラーハンドリング、進捗追跡を含む
 */
export function useVideoConverter(options: UseVideoConverterOptions = {}) {
  const {
    autoInitialize = true,
    defaultOptions = {},
    onInitialized,
    onInitError,
    onConversionStart,
    onConversionComplete,
    onBatchComplete,
    onError
  } = options;

  const errorHandler = useConversionErrorHandler({
    onError: (error: AppError) => {
      setState(prev => ({ ...prev, error: error.userMessage }));
    }
  });

  // State
  const [state, setState] = useState<ConversionState>({
    isInitialized: false,
    isInitializing: false,
    isConverting: false,
    currentFile: null,
    progress: null,
    results: [],
    error: null
  });

  // Refs
  const converterRef = useRef<VideoConverter | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  /**
   * 初期化処理
   */
  const initialize = useCallback(async () => {
    if (state.isInitialized || state.isInitializing) return;

    setState(prev => ({ ...prev, isInitializing: true, error: null }));

    try {
      if (!converterRef.current) {
        converterRef.current = getVideoConverter();
      }

      // FFmpegWorkerManagerの初期化は遅延実行されるため、ここでは準備完了のマークのみ
      setState(prev => ({ 
        ...prev, 
        isInitialized: true, 
        isInitializing: false 
      }));
      
      onInitialized?.();
    } catch (error) {
      const handledError = errorHandler.handleError(error, { context: 'converter-initialization' });
      setState(prev => ({ 
        ...prev, 
        isInitializing: false, 
        error: handledError.userMessage 
      }));
      
      onInitError?.(handledError.userMessage);
    }
  }, [state.isInitialized, state.isInitializing, onInitialized, onInitError]);

  /**
   * 単一ファイル変換
   */
  const convertFile = useCallback(async (
    file: File,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> => {
    if (!converterRef.current) {
      throw new Error('Converter not initialized');
    }

    if (state.isConverting) {
      throw new Error('Another conversion is already in progress');
    }

    const fileId = `${file.name}-${file.size}-${file.lastModified}`;
    
    setState(prev => ({
      ...prev,
      isConverting: true,
      currentFile: fileId,
      error: null
    }));

    onConversionStart?.(fileId);

    // AbortController設定
    abortControllerRef.current = new AbortController();

    try {
      const mergedOptions = { ...defaultOptions, ...options };
      
      const result = await converterRef.current.convertFile(
        file,
        mergedOptions,
        (progress: ConversionProgress) => {
          setState(prev => ({
            ...prev,
            progress: {
              totalFiles: 1,
              completedFiles: progress.stage === 'completed' ? 1 : 0,
              failedFiles: progress.stage === 'error' ? 1 : 0,
              processingFiles: progress.stage === 'processing' ? 1 : 0,
              overallPercentage: progress.percentage,
              fileProgresses: [progress],
              isComplete: progress.stage === 'completed' || progress.stage === 'error',
              hasErrors: progress.stage === 'error'
            }
          }));
        },
        abortControllerRef.current.signal
      );

      setState(prev => ({
        ...prev,
        isConverting: false,
        currentFile: null,
        results: [...prev.results, result]
      }));

      onConversionComplete?.(result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown conversion error';
      
      setState(prev => ({
        ...prev,
        isConverting: false,
        currentFile: null,
        error: errorMessage
      }));

      onError?.(errorMessage, fileId);
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [state.isConverting, defaultOptions, onConversionStart, onConversionComplete, onError]);

  /**
   * 複数ファイル変換（バッチ）
   */
  const convertBatch = useCallback(async (
    files: File[] | FileUploadItem[],
    options: BatchConversionOptions = {}
  ): Promise<BatchConversionResult> => {
    if (!converterRef.current) {
      throw new Error('Converter not initialized');
    }

    if (state.isConverting) {
      throw new Error('Another conversion is already in progress');
    }

    // FileUploadItemの場合はFileに変換
    const fileArray = Array.isArray(files) 
      ? (files.length > 0 && 'file' in files[0] 
          ? extractFilesFromUploadItems(files as FileUploadItem[])
          : files as File[])
      : [];

    setState(prev => ({
      ...prev,
      isConverting: true,
      currentFile: null,
      error: null,
      results: [] // バッチ開始時にリセット
    }));

    // AbortController設定
    abortControllerRef.current = new AbortController();

    try {
      const mergedOptions = { 
        ...options,
        conversionOptions: { ...defaultOptions, ...options.conversionOptions }
      };

      const result = await converterRef.current.convertBatch(
        fileArray,
        mergedOptions,
        (progress: BatchProgress) => {
          setState(prev => ({
            ...prev,
            progress
          }));
        },
        abortControllerRef.current.signal
      );

      setState(prev => ({
        ...prev,
        isConverting: false,
        results: result.results,
        progress: result.finalProgress
      }));

      onBatchComplete?.(result);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown batch conversion error';
      
      setState(prev => ({
        ...prev,
        isConverting: false,
        error: errorMessage
      }));

      onError?.(errorMessage);
      throw error;
    } finally {
      abortControllerRef.current = null;
    }
  }, [state.isConverting, defaultOptions, onBatchComplete, onError]);

  /**
   * 変換キャンセル
   */
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }

    if (converterRef.current) {
      converterRef.current.cancel();
    }

    setState(prev => ({
      ...prev,
      isConverting: false,
      currentFile: null,
      progress: null,
      error: 'Conversion cancelled by user'
    }));
  }, []);

  /**
   * 状態リセット
   */
  const reset = useCallback(() => {
    cancel();
    setState({
      isInitialized: state.isInitialized,
      isInitializing: false,
      isConverting: false,
      currentFile: null,
      progress: null,
      results: [],
      error: null
    });
  }, [cancel, state.isInitialized]);

  /**
   * 統計情報計算
   */
  const stats = useState<ConversionStats | null>(() => {
    if (state.results.length === 0) return null;
    return getConversionStats(state.results);
  })[0];

  /**
   * リソースクリーンアップ
   */
  const cleanup = useCallback(async () => {
    cancel();
    if (converterRef.current) {
      await converterRef.current.cleanup();
      converterRef.current = null;
    }
    setState({
      isInitialized: false,
      isInitializing: false,
      isConverting: false,
      currentFile: null,
      progress: null,
      results: [],
      error: null
    });
  }, [cancel]);

  // 自動初期化
  useEffect(() => {
    if (autoInitialize && !state.isInitialized && !state.isInitializing) {
      initialize();
    }
  }, [autoInitialize, initialize, state.isInitialized, state.isInitializing]);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    // State
    ...state,
    stats,

    // Actions
    initialize,
    convertFile,
    convertBatch,
    cancel,
    reset,
    cleanup,

    // Computed values
    canConvert: state.isInitialized && !state.isConverting,
    hasResults: state.results.length > 0,
    successfulResults: state.results.filter(r => r.success),
    failedResults: state.results.filter(r => !r.success),
    isIdle: !state.isInitializing && !state.isConverting
  };
}

/**
 * 便利な型ガード関数
 */
export function isFileUploadItem(item: File | FileUploadItem): item is FileUploadItem {
  return 'file' in item && item.file instanceof File;
}

/**
 * 便利なヘルパー関数
 */
export const videoConverterHelpers = {
  /**
   * 進捗パーセンテージをフォーマット
   */
  formatProgress: (percentage: number): string => {
    return `${Math.round(percentage)}%`;
  },

  /**
   * 時間をフォーマット
   */
  formatTime: (seconds: number | null): string => {
    if (seconds === null) return '--:--';
    
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  },

  /**
   * ファイルサイズをフォーマット
   */
  formatFileSize: (bytes: number): string => {
    const units = ['B', 'KB', 'MB', 'GB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  },

  /**
   * エラータイプを読みやすい形式に変換
   */
  formatErrorType: (errorType: ConversionErrorType): string => {
    const errorMap = {
      [ConversionErrorType.VALIDATION_ERROR]: 'Validation Error',
      [ConversionErrorType.CONVERSION_ERROR]: 'Conversion Error',
      [ConversionErrorType.WORKER_ERROR]: 'Worker Error',
      [ConversionErrorType.ABORT_ERROR]: 'Cancelled',
      [ConversionErrorType.TIMEOUT_ERROR]: 'Timeout',
      [ConversionErrorType.MEMORY_ERROR]: 'Memory Error'
    };
    return errorMap[errorType] || 'Unknown Error';
  },

  /**
   * 処理段階を読みやすい形式に変換
   */
  formatStage: (stage: ConversionProgress['stage']): string => {
    const stageMap = {
      initializing: 'Initializing...',
      processing: 'Converting...',
      completed: 'Completed',
      error: 'Error'
    };
    return stageMap[stage] || stage;
  }
};

