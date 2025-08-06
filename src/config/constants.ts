// Video to MP3 Converter - Constants and Configuration

// ファイルサイズ制限 (bytes)
export const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
export const MIN_FILE_SIZE = 1024; // 1KB

// 対応ファイル形式
export const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/mkv',
  'video/webm',
  'video/3gp',
  'video/m4v',
  'video/quicktime'
] as const;

export const SUPPORTED_VIDEO_EXTENSIONS = [
  '.mp4', '.avi', '.mov', '.wmv', '.flv', '.mkv', '.webm', '.3gp', '.m4v'
] as const;

// 出力オーディオ設定
export const AUDIO_QUALITY_PRESETS = {
  high: { bitrate: 320, quality: 0 },
  medium: { bitrate: 192, quality: 4 },
  low: { bitrate: 128, quality: 7 }
} as const;

export const DEFAULT_CONVERSION_OPTIONS = {
  quality: 'medium' as const,
  bitrate: 192,
  format: 'mp3' as const
};

// FFmpeg設定
export const FFMPEG_CONFIG = {
  CORE_URL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.js',
  WASM_URL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.wasm',
  WORKER_URL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/ffmpeg-core.worker.js',
  TIMEOUT: 300000 // 5分
} as const;

// UI設定
export const UI_CONFIG = {
  PROGRESS_UPDATE_INTERVAL: 100, // ms
  TOAST_DURATION: 5000, // ms
  ANIMATION_DURATION: 300 // ms
} as const;

// PWA設定
export const PWA_CONFIG = {
  APP_NAME: 'Video to MP3 Converter',
  SHORT_NAME: 'VideoConv',
  DESCRIPTION: 'ブラウザ内で動画をMP3に変換するWebアプリケーション',
  THEME_COLOR: '#3B82F6',
  BACKGROUND_COLOR: '#1F2937'
} as const;

// エラー設定
export const ERROR_CONFIG = {
  MAX_RETRIES: 3,
  RETRY_DELAY: 1000, // ms
  TIMEOUT_DURATION: 300000 // 5分
} as const;

// ブラウザ互換性チェック
export const BROWSER_REQUIREMENTS = {
  SHARED_ARRAY_BUFFER: typeof SharedArrayBuffer !== 'undefined',
  WEB_WORKERS: typeof Worker !== 'undefined',
  WASM: typeof WebAssembly !== 'undefined',
  FILE_API: typeof File !== 'undefined'
} as const;