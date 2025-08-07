// File upload related types
export interface FileUploadItem {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  status: 'pending' | 'uploading' | 'success' | 'error' | 'converting';
  error?: string;
  preview?: {
    duration?: number;
    dimensions?: {
      width: number;
      height: number;
    };
  };
  conversionProgress?: {
    progress: number;
    time?: string;
  };
  convertedData?: {
    data: Uint8Array;
    filename: string;
  };
}

export interface FileValidationResult {
  isValid: boolean;
  error?: string;
}

export interface FileUploadConfig {
  maxFileSize: number; // in bytes
  allowedFormats: string[];
  maxFiles: number;
}

// Drag and drop event types
export interface DragDropEvent extends React.DragEvent<HTMLDivElement> {
  dataTransfer: DataTransfer;
}

export interface FileUploadCallbacks {
  onFilesSelected: (files: FileUploadItem[]) => void;
  onFileRemove: (fileId: string) => void;
  onFileValidationError: (error: string, file: File) => void;
  onDragEnter?: () => void;
  onDragLeave?: () => void;
}

// Constants for file upload configuration
export const FILE_UPLOAD_CONFIG: FileUploadConfig = {
  maxFileSize: 500 * 1024 * 1024, // 500MB
  allowedFormats: ['mp4', 'webm', 'avi', 'mov', 'mkv', 'wmv', 'flv', 'f4v', 'm4v', '3gp', 'ogv'],
  maxFiles: 10
};

export const SUPPORTED_VIDEO_MIME_TYPES = [
  'video/mp4',
  'video/webm',
  'video/avi',
  'video/x-msvideo',
  'video/quicktime',
  'video/x-matroska',
  'video/x-ms-wmv',
  'video/x-flv',
  'video/x-f4v',
  'video/x-m4v',
  'video/3gpp',
  'video/ogg'
];

// FFmpeg Worker Types
export interface FFmpegWorkerMessage {
  type: string;
  id: string;
  data?: any;
}

export interface FFmpegInitMessage extends FFmpegWorkerMessage {
  type: 'init';
  data?: {
    coreURL?: string;
    wasmURL?: string;
  };
}

export interface FFmpegConvertMessage extends FFmpegWorkerMessage {
  type: 'convert';
  data: {
    file: File;
    outputFilename: string;
    bitrate?: string;
  };
}

export interface FFmpegProgressMessage extends FFmpegWorkerMessage {
  type: 'progress';
  data: {
    ratio: number;
    time?: string;
  };
}

export interface FFmpegCompleteMessage extends FFmpegWorkerMessage {
  type: 'complete';
  data: {
    outputData: Uint8Array;
    outputFilename: string;
  };
}

export interface FFmpegErrorMessage extends FFmpegWorkerMessage {
  type: 'error';
  data: {
    message: string;
    code?: string;
  };
}

export interface FFmpegReadyMessage extends FFmpegWorkerMessage {
  type: 'ready';
  data?: Record<string, never>;
}

export type FFmpegWorkerResponse = 
  | FFmpegProgressMessage 
  | FFmpegCompleteMessage 
  | FFmpegErrorMessage 
  | FFmpegReadyMessage;

// FFmpeg Configuration
export const FFMPEG_CONFIG = {
  bitrate: '128k',
  format: 'mp3',
  codec: 'libmp3lame',
  progressUpdateInterval: 100, // ms
  timeout: 30 * 60 * 1000, // 30 minutes
  coreURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.js',
  wasmURL: 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/esm/ffmpeg-core.wasm',
} as const;

// Conversion Types
export interface ConversionOptions {
  format?: string;
  bitrate?: number;
  quality?: string;
  codec?: string;
  timeout?: number;
}

export interface ConversionProgress {
  fileId: string;
  percentage: number;
  stage: 'initializing' | 'processing' | 'completed' | 'error';
  timeRemaining: number | null;
  processedTime: string | null;
  totalTime: string | null;
  speed: string | null;
  error?: string;
}

export interface ConversionResult {
  fileId: string;
  originalFile: File;
  convertedData: Uint8Array | null;
  success: boolean;
  error?: ConversionError;
  processingTime: number;
  outputFormat: string;
  bitrate: number;
  timestamp: string;
}

export interface ConversionError {
  name: string;
  type: ConversionErrorType;
  message: string;
  originalError?: Error;
  fileId?: string;
}

export type ConversionErrorType = 
  | 'VALIDATION_ERROR'
  | 'CONVERSION_ERROR'
  | 'WORKER_ERROR'
  | 'ABORT_ERROR'
  | 'TIMEOUT_ERROR'
  | 'MEMORY_ERROR';

// Batch Conversion Types
export interface BatchProgress {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  processingFiles: number;
  overallPercentage: number;
  fileProgresses: ConversionProgress[];
  isComplete: boolean;
  hasErrors: boolean;
}

export interface BatchConversionOptions {
  mode?: 'sequential' | 'parallel';
  conversionOptions?: ConversionOptions;
  maxConcurrency?: number;
}

export interface BatchConversionResult {
  results: ConversionResult[];
  totalFiles: number;
  successCount: number;
  failureCount: number;
  totalProcessingTime: number;
  aborted: boolean;
  error?: ConversionError;
  timestamp: string;
  finalProgress: BatchProgress;
}

// Progress UI Types
export type ProgressUIVariant = 'detailed' | 'compact' | 'minimal';
export type ProgressUIStatus = 'pending' | 'active' | 'success' | 'error' | 'warning';

export interface ProgressUIConfig {
  variant: ProgressUIVariant;
  showFileDetails: boolean;
  showOverallProgress: boolean;
  showStats: boolean;
  showTimeRemaining: boolean;
  animated: boolean;
  responsive: boolean;
}

export interface ConversionStats {
  totalFiles: number;
  successCount: number;
  failureCount: number;
  successRate: number;
  totalProcessingTime: number;
  averageProcessingTime: number;
  totalDataSize: number;
  convertedDataSize: number;
}

// Download Types
export interface DownloadOptions {
  filename?: string;
  format?: 'mp3';
  includeMetadata?: boolean;
  useOriginalName?: boolean;
}

export interface BatchDownloadOptions {
  format?: 'zip';
  archiveName?: string;
  includeFailedFiles?: boolean;
  compression?: 'none' | 'fast' | 'best';
}

export interface DownloadProgress {
  fileId: string;
  fileName: string;
  stage: 'preparing' | 'downloading' | 'completed' | 'error';
  percentage: number;
  bytesDownloaded: number;
  totalBytes: number;
  speed: string | null;
  timeRemaining: number | null;
  error?: string;
}

export interface BatchDownloadProgress {
  totalFiles: number;
  completedFiles: number;
  failedFiles: number;
  overallPercentage: number;
  currentFile?: string;
  stage: 'preparing' | 'creating_archive' | 'downloading' | 'completed' | 'error';
  fileProgresses: DownloadProgress[];
  archiveSize: number;
  error?: string;
}

export interface DownloadResult {
  fileId: string;
  fileName: string;
  success: boolean;
  downloadUrl?: string;
  error?: string;
  timestamp: string;
  fileSize: number;
}

export interface BatchDownloadResult {
  results: DownloadResult[];
  archiveUrl?: string;
  archiveName: string;
  totalFiles: number;
  successCount: number;
  failureCount: number;
  totalSize: number;
  success: boolean;
  error?: string;
  timestamp: string;
}

// DownloadError is now implemented as DownloadErrorClass in download.ts

export type DownloadErrorType =
  | 'INVALID_DATA'
  | 'BLOB_CREATION_ERROR'
  | 'ARCHIVE_CREATION_ERROR'
  | 'DOWNLOAD_FAILED'
  | 'FILE_NOT_FOUND'
  | 'PERMISSION_ERROR';

// Re-export error system types for consistency
export type { AppError, AppErrorType } from '../utils/errorUtils';
export type { ToastNotification } from '../hooks/useGlobalErrorHandler';

// === PWA Types ===

export interface PWABeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

export interface PWAInstallState {
  canInstall: boolean;
  isInstalling: boolean;
  installError: string | null;
  isInstalled: boolean;
}

export interface PWAUpdateState {
  isUpdateAvailable: boolean;
  isUpdating: boolean;
  updateError: string | null;
}

export interface PWANetworkState {
  isOnline: boolean;
  effectiveType?: string;
  saveData?: boolean;
}

export interface PWACapabilities {
  serviceWorker: boolean;
  beforeInstallPrompt: boolean;
  standalone: boolean;
  fullscreen: boolean;
}

export interface PWAManifest {
  name: string;
  short_name: string;
  description: string;
  start_url: string;
  display: 'fullscreen' | 'standalone' | 'minimal-ui' | 'browser';
  background_color: string;
  theme_color: string;
  icons: PWAIcon[];
}

export interface PWAIcon {
  src: string;
  sizes: string;
  type: string;
  purpose?: 'maskable' | 'any' | 'monochrome';
}
