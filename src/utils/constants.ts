/**
 * アプリケーション設定定数
 * 動画→MP3変換アプリ用の設定値
 */

import type { AppConfig, SupportedVideoMimeTypes } from '../types';

/**
 * サポートされる動画形式のMIME type一覧
 */
export const SUPPORTED_VIDEO_TYPES: SupportedVideoMimeTypes[] = [
  'video/mp4',
  'video/webm',
  'video/ogg',
  'video/avi',
  'video/mov',
  'video/mkv',
  'video/flv',
  'video/wmv'
];

/**
 * ファイル拡張子とMIME typeのマッピング
 */
export const FILE_EXTENSION_MAP: Record<string, SupportedVideoMimeTypes> = {
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.ogg': 'video/ogg',
  '.ogv': 'video/ogg',
  '.avi': 'video/avi',
  '.mov': 'video/mov',
  '.mkv': 'video/mkv',
  '.flv': 'video/flv',
  '.wmv': 'video/wmv'
};

/**
 * 最大ファイルサイズ（500MB）
 */
export const MAX_FILE_SIZE = 500 * 1024 * 1024;

/**
 * FFmpeg.wasm CDN設定
 */
export const FFMPEG_CDN = {
  CORE_URL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
  WASM_URL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
  WORKER_URL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.worker.js'
};

/**
 * デフォルトのMP3エンコード設定
 */
export const DEFAULT_MP3_CONFIG = {
  BITRATE: 128,
  SAMPLE_RATE: 44100,
  CHANNELS: 2
} as const;

/**
 * エラーメッセージ
 */
export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: `ファイルサイズが大きすぎます（最大${Math.round(MAX_FILE_SIZE / 1024 / 1024)}MB）`,
  UNSUPPORTED_FORMAT: 'サポートされていないファイル形式です',
  FFMPEG_LOAD_FAILED: 'FFmpeg.wasmの読み込みに失敗しました',
  CONVERSION_FAILED: 'MP3変換に失敗しました',
  FILE_READ_FAILED: 'ファイルの読み込みに失敗しました',
  CROSS_ORIGIN_ISOLATION_REQUIRED: 'Cross-Origin Isolationが必要です（Chrome専用機能）',
  SHARED_ARRAY_BUFFER_UNAVAILABLE: 'SharedArrayBufferが利用できません'
} as const;

/**
 * 変換進捗のステップ名
 */
export const CONVERSION_STEPS = {
  INITIALIZING: 'FFmpeg.wasmを初期化中...',
  LOADING_FILE: 'ファイルを読み込み中...',
  CONVERTING: 'MP3に変換中...',
  FINALIZING: '変換を完了中...',
  COMPLETED: '変換完了！'
} as const;

/**
 * アプリケーション設定
 */
export const APP_CONFIG: AppConfig = {
  maxFileSize: MAX_FILE_SIZE,
  supportedFormats: SUPPORTED_VIDEO_TYPES,
  ffmpeg: {
    bitrate: DEFAULT_MP3_CONFIG.BITRATE,
    sampleRate: DEFAULT_MP3_CONFIG.SAMPLE_RATE,
    channels: DEFAULT_MP3_CONFIG.CHANNELS,
    coreUrl: FFMPEG_CDN.CORE_URL,
    wasmUrl: FFMPEG_CDN.WASM_URL,
    useWorker: true
  },
  debug: Boolean(import.meta.env.DEV)
};

/**
 * ファイルサイズをフォーマットする
 */
export const formatFileSize = (bytes: number): string => {
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = bytes;
  let unitIndex = 0;

  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex++;
  }

  return `${size.toFixed(unitIndex > 0 ? 1 : 0)} ${units[unitIndex]}`;
};

/**
 * 時間を mm:ss 形式でフォーマットする
 */
export const formatDuration = (seconds: number): string => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * ファイル名から拡張子を除去する
 */
export const removeFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(0, lastDotIndex) : filename;
};

/**
 * ファイル名からMP3ファイル名を生成する
 */
export const generateMp3Filename = (originalFilename: string): string => {
  const nameWithoutExt = removeFileExtension(originalFilename);
  return `${nameWithoutExt}.mp3`;
};

/**
 * エラーコードに基づく回復可能性の判定
 */
export const ERROR_RECOVERY_MAP = {
  'FILE_TOO_LARGE': true,
  'UNSUPPORTED_FORMAT': true,
  'FILE_READ_ERROR': true,
  'STORAGE_QUOTA_EXCEEDED': true,
  'FILE_ACCESS_DENIED': false,
  'MEMORY_ERROR': true,
  'NETWORK_ERROR': true,
  'TIMEOUT_ERROR': true,
  'DOWNLOAD_BLOCKED': true,
  'DOWNLOAD_FAILED': true,
  'FFMPEG_LOAD_FAILED': true,
  'CONVERSION_ERROR': false,
  'SHARED_ARRAY_BUFFER_UNAVAILABLE': false,
  'CROSS_ORIGIN_ISOLATION_REQUIRED': false,
} as const;

/**
 * パフォーマンス監視の設定
 */
export const PERFORMANCE_CONFIG = {
  PROGRESS_THROTTLE_MS: 100,
  METADATA_TIMEOUT_BASE_MS: 5000,
  METADATA_TIMEOUT_PER_MB: 1000,
  PREVIEW_TIMEOUT_BASE_MS: 10000,
  PREVIEW_TIMEOUT_PER_MB: 1500,
  MAX_METADATA_TIMEOUT_MS: 20000,
  MAX_PREVIEW_TIMEOUT_MS: 30000,
  MEMORY_WARNING_THRESHOLD_MB: 100,
} as const;