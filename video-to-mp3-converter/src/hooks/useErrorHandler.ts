import { useCallback, useRef } from 'react';
import { AppError, normalizeError, globalErrorAnalyzer } from '../utils/errorUtils';
import type { AppErrorType } from '../utils/errorUtils';

export interface ErrorHandlerOptions {
  /**
   * エラーコンテキスト（エラーが発生した場所の識別子）
   */
  context?: string;
  
  /**
   * 通知の表示を有効にするか
   */
  enableNotification?: boolean;
  
  /**
   * エラーログを有効にするか
   */
  enableLogging?: boolean;
  
  /**
   * エラー発生時のコールバック
   */
  onError?: (error: AppError) => void;
  
  /**
   * 自動復旧を試行するか
   */
  autoRetry?: boolean;
  
  /**
   * 自動復旧の最大試行回数
   */
  maxRetryAttempts?: number;
}

export interface ErrorHandler {
  /**
   * エラーをハンドリングし、適切な処理を実行
   */
  handleError: (error: unknown, additionalContext?: Record<string, any>) => AppError;
  
  /**
   * 特定タイプのエラーを作成してハンドリング
   */
  createError: (
    type: AppErrorType,
    message: string,
    options?: {
      code?: string;
      context?: Record<string, any>;
      userMessage?: string;
      recoverable?: boolean;
    }
  ) => AppError;
  
  /**
   * 非同期処理のエラーをハンドリング
   */
  handleAsyncError: <T>(
    asyncOperation: () => Promise<T>,
    errorMessage?: string
  ) => Promise<T>;
  
  /**
   * 条件付きエラー処理（指定した条件でエラーを投げる）
   */
  handleConditionalError: (
    condition: boolean,
    errorType: AppErrorType,
    message: string
  ) => void;
  
  /**
   * 復旧可能なエラーの復旧処理
   */
  attemptRecovery: (error: AppError) => Promise<boolean>;
  
  /**
   * エラー発生回数を取得
   */
  getErrorCount: () => number;
  
  /**
   * 最後に発生したエラーを取得
   */
  getLastError: () => AppError | null;
  
  /**
   * エラー履歴をクリア
   */
  clearErrors: () => void;
}

/**
 * エラーハンドリングのためのカスタムフック
 */
export function useErrorHandler(options: ErrorHandlerOptions = {}): ErrorHandler {
  const {
    context = 'unknown',
    enableLogging = true,
    onError,
    autoRetry = false,
    maxRetryAttempts = 3
  } = options;

  const errorCountRef = useRef<number>(0);
  const lastErrorRef = useRef<AppError | null>(null);
  const retryAttemptsRef = useRef<Map<string, number>>(new Map());

  const handleError = useCallback((
    error: unknown,
    additionalContext?: Record<string, any>
  ): AppError => {
    // エラーを正規化
    const normalizedError = normalizeError(error);
    
    // コンテキスト情報を追加
    const enhancedError = new AppError(
      normalizedError.type,
      normalizedError.message,
      {
        ...normalizedError,
        context: {
          ...normalizedError.context,
          handlerContext: context,
          timestamp: new Date().toISOString(),
          ...additionalContext
        }
      }
    );

    // エラーカウントを増加
    errorCountRef.current += 1;
    lastErrorRef.current = enhancedError;

    // グローバル分析器に記録
    if (enableLogging) {
      globalErrorAnalyzer.recordError(enhancedError);
    }

    // 外部コールバックを実行
    if (onError) {
      try {
        onError(enhancedError);
      } catch (callbackError) {
        console.error('Error in onError callback:', callbackError);
      }
    }

    // 自動復旧を試行
    if (autoRetry && enhancedError.recoverable) {
      const errorKey = `${enhancedError.type}-${enhancedError.message}`;
      const currentAttempts = retryAttemptsRef.current.get(errorKey) || 0;
      
      if (currentAttempts < maxRetryAttempts) {
        retryAttemptsRef.current.set(errorKey, currentAttempts + 1);
        
        // 復旧処理を非同期で実行（UIをブロックしない）
        setTimeout(() => {
          attemptRecovery(enhancedError).catch(recoveryError => {
            console.error('Recovery attempt failed:', recoveryError);
          });
        }, 1000 * (currentAttempts + 1)); // 指数バックオフ
      }
    }

    return enhancedError;
  }, [context, enableLogging, onError, autoRetry, maxRetryAttempts]);

  const createError = useCallback((
    type: AppErrorType,
    message: string,
    options: {
      code?: string;
      context?: Record<string, any>;
      userMessage?: string;
      recoverable?: boolean;
    } = {}
  ): AppError => {
    const error = new AppError(type, message, {
      ...options,
      context: {
        ...options.context,
        handlerContext: context,
        createdAt: new Date().toISOString()
      }
    });

    return handleError(error);
  }, [handleError, context]);

  const handleAsyncError = useCallback(async <T>(
    asyncOperation: () => Promise<T>
  ): Promise<T> => {
    try {
      return await asyncOperation();
    } catch (error) {
      const handledError = handleError(error, { asyncOperation: true });
      throw handledError;
    }
  }, [handleError]);

  const handleConditionalError = useCallback((
    condition: boolean,
    errorType: AppErrorType,
    message: string
  ): void => {
    if (condition) {
      const error = createError(errorType, message);
      throw error;
    }
  }, [createError]);

  const attemptRecovery = useCallback(async (error: AppError): Promise<boolean> => {
    if (!error.recoverable) {
      return false;
    }

    try {
      console.log(`Attempting recovery for error: ${error.type}`);

      switch (error.type) {
        case 'NETWORK_ERROR':
          // ネットワークエラーの場合、単純に再試行
          await new Promise(resolve => setTimeout(resolve, 2000));
          return true;

        case 'WORKER_ERROR':
          // Workerエラーの場合、Worker再初期化を試行
          console.log('Attempting worker recovery...');
          // 実際のWorker再初期化は各コンポーネントで実装
          return false; // 現時点では手動対応が必要

        case 'TIMEOUT_ERROR':
          // タイムアウトエラーは復旧不可（ファイルサイズの問題）
          return false;

        case 'VALIDATION_ERROR':
          // バリデーションエラーは自動復旧不可（ユーザー操作が必要）
          return false;

        default:
          return false;
      }
    } catch (recoveryError) {
      console.error('Recovery attempt failed:', recoveryError);
      return false;
    }
  }, []);

  const getErrorCount = useCallback((): number => {
    return errorCountRef.current;
  }, []);

  const getLastError = useCallback((): AppError | null => {
    return lastErrorRef.current;
  }, []);

  const clearErrors = useCallback((): void => {
    errorCountRef.current = 0;
    lastErrorRef.current = null;
    retryAttemptsRef.current.clear();
  }, []);

  return {
    handleError,
    createError,
    handleAsyncError,
    handleConditionalError,
    attemptRecovery,
    getErrorCount,
    getLastError,
    clearErrors
  };
}

/**
 * 特定のコンテキスト用のプリセット設定
 */
export const createContextualErrorHandler = (context: string) => {
  return (additionalOptions: Partial<ErrorHandlerOptions> = {}) => {
    return useErrorHandler({
      context,
      enableNotification: true,
      enableLogging: true,
      ...additionalOptions
    });
  };
};

/**
 * よく使われるコンテキストのプリセット
 */
export const useFileUploadErrorHandler = createContextualErrorHandler('FileUpload');
export const useConversionErrorHandler = createContextualErrorHandler('Conversion');
export const useDownloadErrorHandler = createContextualErrorHandler('Download');
export const useWorkerErrorHandler = createContextualErrorHandler('Worker');

/**
 * バッチ処理用のエラーハンドラー
 */
export function useBatchErrorHandler(batchContext: string) {
  const handler = useErrorHandler({
    context: `Batch-${batchContext}`,
    enableNotification: false, // バッチ処理では個別通知を無効化
    enableLogging: true
  });

  const batchErrorsRef = useRef<AppError[]>([]);

  const handleBatchError = useCallback((
    error: unknown,
    itemId: string,
    additionalContext?: Record<string, any>
  ): AppError => {
    const handledError = handler.handleError(error, {
      ...additionalContext,
      itemId,
      batchContext
    });

    batchErrorsRef.current.push(handledError);
    return handledError;
  }, [handler, batchContext]);

  const getBatchErrors = useCallback((): AppError[] => {
    return [...batchErrorsRef.current];
  }, []);

  const clearBatchErrors = useCallback((): void => {
    batchErrorsRef.current = [];
    handler.clearErrors();
  }, [handler]);

  const getBatchErrorSummary = useCallback(() => {
    const errors = batchErrorsRef.current;
    const errorsByType = errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<AppErrorType, number>);

    return {
      totalErrors: errors.length,
      errorsByType,
      hasRecoverableErrors: errors.some(e => e.recoverable),
      hasNonRecoverableErrors: errors.some(e => !e.recoverable)
    };
  }, []);

  return {
    ...handler,
    handleBatchError,
    getBatchErrors,
    clearBatchErrors,
    getBatchErrorSummary
  };
}