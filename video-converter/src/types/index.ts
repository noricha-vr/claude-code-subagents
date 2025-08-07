// File and conversion related types
export interface VideoFile {
  id: string;
  file: File;
  name: string;
  size: number;
  type: string;
  duration?: number;
  thumbnail?: string;
}

export interface ConvertedFile {
  id: string;
  originalId: string;
  data: Uint8Array;
  name: string;
  size: number;
  url?: string;
}

// Conversion status and progress
export enum ConversionStatus {
  IDLE = 'idle',
  LOADING_FFMPEG = 'loading_ffmpeg',
  PROCESSING = 'processing',
  COMPLETED = 'completed',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

export interface ConversionProgress {
  fileId: string;
  status: ConversionStatus;
  progress: number; // 0-100
  currentStep: string;
  timeRemaining?: number;
  speed?: number;
}

export interface ConversionResult {
  success: boolean;
  fileId: string;
  convertedFile?: ConvertedFile;
  error?: ConversionError;
  duration: number; // conversion time in ms
}

// Error handling
export enum ErrorType {
  FILE_TOO_LARGE = 'file_too_large',
  UNSUPPORTED_FORMAT = 'unsupported_format',
  FFMPEG_LOAD_FAILED = 'ffmpeg_load_failed',
  CONVERSION_FAILED = 'conversion_failed',
  NETWORK_ERROR = 'network_error',
  MEMORY_ERROR = 'memory_error',
  USER_CANCELLED = 'user_cancelled'
}

export interface ConversionError {
  type: ErrorType;
  message: string;
  details?: string;
  recoverable: boolean;
}

// Configuration and settings
export interface ConversionConfig {
  bitrate: number; // Always 128 for MP3
  format: 'mp3';
  quality: 'standard';
  includeMetadata: boolean;
}

export interface AppSettings {
  maxFileSize: number; // in bytes
  maxFiles: number;
  supportedFormats: string[];
  defaultConfig: ConversionConfig;
}

// FFmpeg specific
export interface FFmpegInstance {
  loaded: boolean;
  ready: boolean;
  error?: string;
}

// UI state
export interface DragState {
  isDragging: boolean;
  isValidDrop: boolean;
}

export interface AppState {
  files: VideoFile[];
  conversions: Map<string, ConversionProgress>;
  convertedFiles: Map<string, ConvertedFile>;
  ffmpeg: FFmpegInstance;
  settings: AppSettings;
  dragState: DragState;
}