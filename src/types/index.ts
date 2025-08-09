/**
 * 動画→MP3変換アプリケーション 型定義
 * Chrome専用・SharedArrayBuffer使用・128kbps固定MP3出力
 */

/**
 * 変換ステータスを表すenum
 * - idle: 待機中（初期状態）
 * - loading: FFmpegライブラリ読み込み中
 * - processing: 変換処理中
 * - completed: 変換完了
 * - error: エラー発生
 */
export enum ConversionStatus {
  IDLE = 'idle',
  LOADING = 'loading',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error'
}

/**
 * アップロードされた動画ファイルの情報
 */
export interface VideoFile {
  /** 元ファイル */
  file: File;
  /** ファイル名（拡張子なし） */
  name: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** MIME type */
  type: string;
  /** ファイル継続時間（秒） - 取得可能な場合のみ */
  duration?: number;
  /** プレビュー用データURL - 取得可能な場合のみ */
  previewUrl?: string;
}

/**
 * MP3変換後ファイルの情報
 */
export interface Mp3File {
  /** 変換後のファイル名 */
  name: string;
  /** ファイルサイズ（バイト） */
  size: number;
  /** BlobデータのURL */
  url: string;
  /** ビットレート（固定128kbps） */
  bitrate: 128;
  /** 継続時間（秒） */
  duration: number;
}

/**
 * 変換処理の進捗状況
 */
export interface ConversionProgress {
  /** 進捗率（0-100） */
  percentage: number;
  /** 現在の処理内容 */
  currentStep: string;
  /** 処理開始時刻 */
  startTime: number;
  /** 推定残り時間（ミリ秒） */
  estimatedTimeLeft?: number;
}

/**
 * 変換処理の状態管理
 */
export interface ConversionState {
  /** 現在のステータス */
  status: ConversionStatus;
  /** アップロードされた動画ファイル */
  videoFile: VideoFile | null;
  /** 変換後のMP3ファイル */
  mp3File: Mp3File | null;
  /** 変換進捗情報 */
  progress: ConversionProgress | null;
  /** エラーメッセージ */
  errorMessage: string | null;
}

/**
 * FFmpeg.wasmサービスで使用する設定
 */
export interface FFmpegConfig {
  /** MP3エンコードビットレート（固定128kbps） */
  bitrate: 128;
  /** サンプルレート */
  sampleRate: 44100;
  /** チャンネル数（1: モノラル、2: ステレオ） */
  channels: 2;
  /** FFmpegライブラリのCDN URL */
  coreUrl: string;
  /** FFmpeg wasmファイルのCDN URL */
  wasmUrl: string;
  /** Web Worker使用フラグ */
  useWorker: boolean;
}

/**
 * ドラッグ&ドロップエリアの状態
 */
export interface DragState {
  /** ドラッグ中フラグ */
  isDragging: boolean;
  /** ドラッグオーバー中フラグ */
  isDragOver: boolean;
  /** ドロップ可能フラグ */
  isDroppable: boolean;
}

/**
 * サポートされる動画形式のMIME type
 */
export type SupportedVideoMimeTypes = 
  | 'video/mp4'
  | 'video/webm'
  | 'video/ogg'
  | 'video/avi'
  | 'video/mov'
  | 'video/mkv'
  | 'video/flv'
  | 'video/wmv';

/**
 * ファイル検証結果
 */
export interface FileValidationResult {
  /** 検証成功フラグ */
  isValid: boolean;
  /** エラーメッセージ（検証失敗時） */
  errorMessage?: string;
  /** 検証されたファイル情報（成功時） */
  videoFile?: VideoFile;
}

/**
 * アプリケーションの環境設定
 */
export interface AppConfig {
  /** 最大ファイルサイズ（バイト） */
  maxFileSize: number;
  /** サポートする動画形式 */
  supportedFormats: SupportedVideoMimeTypes[];
  /** FFmpeg設定 */
  ffmpeg: FFmpegConfig;
  /** デバッグモード */
  debug: boolean;
}

/**
 * エラー情報の詳細
 */
export interface AppError {
  /** エラーコード */
  code: string;
  /** エラーメッセージ */
  message: string;
  /** 詳細情報 */
  details?: string;
  /** 発生時刻 */
  timestamp: number;
  /** スタックトレース（開発環境のみ） */
  stack?: string;
}

/**
 * useConversionフックの戻り値型定義
 */
export interface UseConversionReturn {
  // 状態
  state: ConversionState;
  status: ConversionStatus;
  
  // アクション
  selectFile: (file: File) => Promise<boolean>;
  selectFiles: (files: FileList | File[]) => Promise<boolean>;
  convertToMp3: () => Promise<boolean>;
  downloadMp3: () => void;
  reset: () => void;
  
  // ユーティリティ
  isIdle: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  hasError: boolean;
  canConvert: boolean;
  canDownload: boolean;
}