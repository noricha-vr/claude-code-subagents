import type { ConversionError } from '../types';

/**
 * アプリケーション全体で使用するエラータイプ分類
 */
export type AppErrorType =
  | 'VALIDATION_ERROR'
  | 'CONVERSION_ERROR'
  | 'DOWNLOAD_ERROR'
  | 'NETWORK_ERROR'
  | 'WORKER_ERROR'
  | 'ENVIRONMENT_ERROR'
  | 'FILE_SYSTEM_ERROR'
  | 'MEMORY_ERROR'
  | 'TIMEOUT_ERROR'
  | 'USER_ABORT_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * アプリケーション全体で使用する統一エラークラス
 */
export class AppError extends Error {
  public readonly type: AppErrorType;
  public readonly code?: string;
  public readonly originalError?: Error;
  public readonly context?: Record<string, any>;
  public readonly timestamp: string;
  public readonly userMessage: string;
  public readonly recoverable: boolean;
  public readonly stack?: string;

  constructor(
    type: AppErrorType,
    message: string,
    options: {
      code?: string;
      originalError?: Error;
      context?: Record<string, any>;
      userMessage?: string;
      recoverable?: boolean;
    } = {}
  ) {
    super(message);
    
    this.name = 'AppError';
    this.type = type;
    this.code = options.code;
    this.originalError = options.originalError;
    this.context = options.context;
    this.timestamp = new Date().toISOString();
    this.userMessage = options.userMessage || this.getDefaultUserMessage();
    this.recoverable = options.recoverable ?? this.getDefaultRecoverable();

    // Maintain proper stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }

    // Capture original error stack if available
    if (options.originalError && options.originalError.stack) {
      this.stack = `${this.stack}\n\nCaused by: ${options.originalError.stack}`;
    }
  }

  /**
   * エラータイプに基づくデフォルトユーザーメッセージ
   */
  private getDefaultUserMessage(): string {
    switch (this.type) {
      case 'VALIDATION_ERROR':
        return 'Please check your input and try again.';
      case 'CONVERSION_ERROR':
        return 'Failed to convert the video file. Please try with a different file.';
      case 'DOWNLOAD_ERROR':
        return 'Failed to download the file. Please try again.';
      case 'NETWORK_ERROR':
        return 'Network connection issue. Please check your internet connection.';
      case 'WORKER_ERROR':
        return 'Processing service is temporarily unavailable. Please try again.';
      case 'ENVIRONMENT_ERROR':
        return 'Your browser environment is not fully compatible. Please try Chrome with secure connection (HTTPS).';
      case 'FILE_SYSTEM_ERROR':
        return 'File system operation failed. Please try again.';
      case 'MEMORY_ERROR':
        return 'Not enough memory to process this file. Try with a smaller file.';
      case 'TIMEOUT_ERROR':
        return 'Operation timed out. Please try again with a smaller file.';
      case 'USER_ABORT_ERROR':
        return 'Operation was cancelled by user.';
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  /**
   * エラータイプに基づくデフォルト回復可能性
   */
  private getDefaultRecoverable(): boolean {
    switch (this.type) {
      case 'VALIDATION_ERROR':
      case 'CONVERSION_ERROR':
      case 'DOWNLOAD_ERROR':
      case 'NETWORK_ERROR':
      case 'TIMEOUT_ERROR':
      case 'USER_ABORT_ERROR':
        return true;
      case 'WORKER_ERROR':
      case 'FILE_SYSTEM_ERROR':
        return true;
      case 'ENVIRONMENT_ERROR':
      case 'MEMORY_ERROR':
        return false;
      default:
        return false;
    }
  }

  /**
   * エラーオブジェクトをJSON形式で出力
   */
  toJSON(): Record<string, any> {
    return {
      name: this.name,
      type: this.type,
      message: this.message,
      userMessage: this.userMessage,
      code: this.code,
      timestamp: this.timestamp,
      recoverable: this.recoverable,
      context: this.context,
      stack: this.stack,
      originalError: this.originalError ? {
        name: this.originalError.name,
        message: this.originalError.message,
        stack: this.originalError.stack
      } : undefined
    };
  }
}

/**
 * 既存のConversionErrorをAppErrorに変換
 */
export function convertToAppError(error: ConversionError): AppError {
  return new AppError(
    error.type as AppErrorType,
    error.message,
    {
      originalError: error.originalError,
      context: { fileId: error.fileId },
      userMessage: error.message
    }
  );
}

/**
 * 任意のエラーをAppErrorに変換
 */
export function normalizeError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    // 特定のエラータイプを推測
    const errorType = inferErrorType(error);
    return new AppError(errorType, error.message, {
      originalError: error
    });
  }

  if (typeof error === 'string') {
    return new AppError('UNKNOWN_ERROR', error);
  }

  return new AppError('UNKNOWN_ERROR', 'An unexpected error occurred', {
    context: { originalError: error }
  });
}

/**
 * エラーメッセージからエラータイプを推測
 */
function inferErrorType(error: Error): AppErrorType {
  const message = error.message.toLowerCase();

  if (message.includes('network') || message.includes('fetch')) {
    return 'NETWORK_ERROR';
  }
  if (message.includes('timeout') || message.includes('timed out')) {
    return 'TIMEOUT_ERROR';
  }
  if (message.includes('memory') || message.includes('out of memory')) {
    return 'MEMORY_ERROR';
  }
  if (message.includes('validation') || message.includes('invalid')) {
    return 'VALIDATION_ERROR';
  }
  if (message.includes('worker') || message.includes('thread')) {
    return 'WORKER_ERROR';
  }
  if (message.includes('file') || message.includes('filesystem')) {
    return 'FILE_SYSTEM_ERROR';
  }
  if (message.includes('environment') || message.includes('browser')) {
    return 'ENVIRONMENT_ERROR';
  }
  if (message.includes('abort') || message.includes('cancel')) {
    return 'USER_ABORT_ERROR';
  }

  return 'UNKNOWN_ERROR';
}

/**
 * エラー分析・統計用のユーティリティクラス
 */
export class ErrorAnalyzer {
  private errors: AppError[] = [];
  private maxErrors = 100; // 最大保持エラー数

  /**
   * エラーを記録
   */
  recordError(error: AppError): void {
    this.errors.push(error);
    
    // 最大数を超えた場合、古いエラーを削除
    if (this.errors.length > this.maxErrors) {
      this.errors = this.errors.slice(-this.maxErrors);
    }

    // コンソールログ（開発環境のみ）
    if (process.env.NODE_ENV === 'development') {
      console.group(`🚨 AppError [${error.type}]`);
      console.error('Message:', error.message);
      console.error('User Message:', error.userMessage);
      console.error('Recoverable:', error.recoverable);
      if (error.context) {
        console.error('Context:', error.context);
      }
      if (error.originalError) {
        console.error('Original Error:', error.originalError);
      }
      console.groupEnd();
    }
  }

  /**
   * エラー統計情報を取得
   */
  getStats(): {
    totalErrors: number;
    errorsByType: Record<AppErrorType, number>;
    recentErrors: AppError[];
    recoverableErrors: number;
    nonRecoverableErrors: number;
    mostCommonError: { type: AppErrorType; count: number } | null;
  } {
    const errorsByType = this.errors.reduce((acc, error) => {
      acc[error.type] = (acc[error.type] || 0) + 1;
      return acc;
    }, {} as Record<AppErrorType, number>);

    const recoverableErrors = this.errors.filter(e => e.recoverable).length;
    const nonRecoverableErrors = this.errors.filter(e => !e.recoverable).length;

    const mostCommonErrorType = Object.entries(errorsByType)
      .sort(([, a], [, b]) => b - a)[0];
    
    const mostCommonError = mostCommonErrorType ? {
      type: mostCommonErrorType[0] as AppErrorType,
      count: mostCommonErrorType[1]
    } : null;

    return {
      totalErrors: this.errors.length,
      errorsByType,
      recentErrors: this.errors.slice(-5), // 直近5件
      recoverableErrors,
      nonRecoverableErrors,
      mostCommonError
    };
  }

  /**
   * 指定期間内のエラーを取得
   */
  getErrorsInTimeRange(startTime: Date, endTime: Date): AppError[] {
    return this.errors.filter(error => {
      const errorTime = new Date(error.timestamp);
      return errorTime >= startTime && errorTime <= endTime;
    });
  }

  /**
   * 特定タイプのエラーを取得
   */
  getErrorsByType(type: AppErrorType): AppError[] {
    return this.errors.filter(error => error.type === type);
  }

  /**
   * エラー履歴をクリア
   */
  clearErrors(): void {
    this.errors = [];
  }

  /**
   * エラーリストを取得
   */
  getAllErrors(): AppError[] {
    return [...this.errors];
  }
}

// グローバルエラーアナライザーのシングルトンインスタンス
export const globalErrorAnalyzer = new ErrorAnalyzer();

/**
 * エラー復旧のためのヘルパー関数
 */
export class ErrorRecovery {
  /**
   * 復旧可能なエラーに対する推奨アクション
   */
  static getRecoveryActions(error: AppError): string[] {
    const actions: string[] = [];

    switch (error.type) {
      case 'VALIDATION_ERROR':
        actions.push('Check file format and size');
        actions.push('Try with a different file');
        break;
      case 'CONVERSION_ERROR':
        actions.push('Retry with the same file');
        actions.push('Try with a different video format');
        actions.push('Use a smaller file size');
        break;
      case 'DOWNLOAD_ERROR':
        actions.push('Retry download');
        actions.push('Check available disk space');
        break;
      case 'NETWORK_ERROR':
        actions.push('Check internet connection');
        actions.push('Retry after a moment');
        break;
      case 'WORKER_ERROR':
        actions.push('Refresh the page');
        actions.push('Try with a smaller file');
        break;
      case 'TIMEOUT_ERROR':
        actions.push('Try with a smaller file');
        actions.push('Close other browser tabs');
        break;
      case 'FILE_SYSTEM_ERROR':
        actions.push('Retry operation');
        actions.push('Clear browser cache');
        break;
      default:
        actions.push('Refresh the page');
        actions.push('Try again later');
    }

    return actions;
  }

  /**
   * エラーの重要度を判定
   */
  static getSeverityLevel(error: AppError): 'low' | 'medium' | 'high' | 'critical' {
    switch (error.type) {
      case 'USER_ABORT_ERROR':
        return 'low';
      case 'VALIDATION_ERROR':
      case 'TIMEOUT_ERROR':
      case 'NETWORK_ERROR':
        return 'medium';
      case 'CONVERSION_ERROR':
      case 'DOWNLOAD_ERROR':
      case 'WORKER_ERROR':
      case 'FILE_SYSTEM_ERROR':
        return 'high';
      case 'ENVIRONMENT_ERROR':
      case 'MEMORY_ERROR':
      case 'UNKNOWN_ERROR':
        return 'critical';
      default:
        return 'medium';
    }
  }
}

/**
 * デバッグ用のエラー情報フォーマッター
 */
export function formatErrorForLogging(error: AppError): string {
  const severity = ErrorRecovery.getSeverityLevel(error);
  const recoveryActions = ErrorRecovery.getRecoveryActions(error);

  return `
[${severity.toUpperCase()}] ${error.type}: ${error.message}
Time: ${error.timestamp}
User Message: ${error.userMessage}
Recoverable: ${error.recoverable}
Context: ${JSON.stringify(error.context, null, 2)}
Recovery Actions: ${recoveryActions.join(', ')}
${error.stack ? `\nStack Trace:\n${error.stack}` : ''}
`;
}