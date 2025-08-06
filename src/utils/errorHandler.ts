// Video to MP3 Converter - Error Handling Utilities

import { AppError } from '../types';

export class ConversionError extends Error {
  public readonly type: AppError['type'];
  public readonly code?: string;
  public readonly details?: unknown;

  constructor(type: AppError['type'], message: string, code?: string, details?: unknown) {
    super(message);
    this.name = 'ConversionError';
    this.type = type;
    this.code = code;
    this.details = details;
  }
}

export const ErrorMessages = {
  FILE_TOO_LARGE: 'ファイルサイズが大きすぎます（最大: 500MB）',
  UNSUPPORTED_FORMAT: 'サポートされていないファイル形式です',
  CONVERSION_FAILED: '変換処理中にエラーが発生しました',
  FFMPEG_LOAD_FAILED: 'FFmpegライブラリの読み込みに失敗しました',
  NETWORK_ERROR: 'ネットワークエラーが発生しました',
  BROWSER_NOT_SUPPORTED: 'お使いのブラウザはサポートされていません',
  INSUFFICIENT_MEMORY: 'メモリ不足です。より小さいファイルをお試しください',
  WORKER_ERROR: 'ワーカープロセスでエラーが発生しました',
  FILE_CORRUPTED: 'ファイルが破損している可能性があります',
  TIMEOUT_ERROR: '処理がタイムアウトしました'
} as const;

export function createError(
  type: AppError['type'], 
  messageKey: keyof typeof ErrorMessages | string,
  code?: string,
  details?: unknown
): AppError {
  const message = messageKey in ErrorMessages 
    ? ErrorMessages[messageKey as keyof typeof ErrorMessages]
    : messageKey;
  
  return {
    type,
    message,
    code,
    details
  };
}

export function handleError(error: unknown): AppError {
  if (error instanceof ConversionError) {
    return {
      type: error.type,
      message: error.message,
      code: error.code,
      details: error.details
    };
  }

  if (error instanceof Error) {
    return {
      type: 'unknown',
      message: error.message,
      details: { stack: error.stack }
    };
  }

  return {
    type: 'unknown',
    message: '予期しないエラーが発生しました',
    details: error
  };
}

export function isAppError(error: unknown): error is AppError {
  return typeof error === 'object' && 
         error !== null && 
         'type' in error && 
         'message' in error;
}