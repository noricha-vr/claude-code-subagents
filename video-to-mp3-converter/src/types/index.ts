// src/types/index.ts

// 変換状態
export enum ConversionStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  CONVERTING = 'converting',
  COMPLETED = 'completed',
  ERROR = 'error'
}

// ビデオファイル情報
export interface VideoFile {
  name: string;
  size: number;
  type: string;
  data: Uint8Array;
  duration?: number;
}

// オーディオファイル情報
export interface AudioFile {
  name: string;
  size: number;
  bitrate: number;
  data: Blob;
  downloadUrl: string;
}

// 変換状態管理
export interface ConversionState {
  status: ConversionStatus;
  progress: number;
  inputFile: VideoFile | null;
  outputFile: AudioFile | null;
  error: Error | null;
}

// エラータイプ
export enum ErrorType {
  FILE_TOO_LARGE = 'FILE_TOO_LARGE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  CONVERSION_FAILED = 'CONVERSION_FAILED',
  FFMPEG_LOAD_FAILED = 'FFMPEG_LOAD_FAILED',
  BROWSER_NOT_SUPPORTED = 'BROWSER_NOT_SUPPORTED'
}

// エラーメッセージ
export interface ErrorMessage {
  type: ErrorType;
  message: string;
  details?: string;
}

// FFmpeg進捗コールバック
export type ProgressCallback = (progress: number) => void;

// 検証結果
export interface ValidationResult {
  isValid: boolean;
  error?: ErrorMessage;
}