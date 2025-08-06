// Video to MP3 Converter - Type Definitions

export interface VideoFile {
  file: File;
  name: string;
  size: number;
  type: string;
  duration?: number;
}

export interface AudioFile {
  blob: Blob;
  name: string;
  size: number;
  url: string;
}

export interface ConversionProgress {
  stage: 'idle' | 'loading' | 'converting' | 'complete' | 'error';
  percentage: number;
  message: string;
  timeRemaining?: number;
}

export interface ConversionState {
  isConverting: boolean;
  progress: ConversionProgress;
  inputFile: VideoFile | null;
  outputFile: AudioFile | null;
  error: string | null;
}

export interface ConversionOptions {
  quality: 'high' | 'medium' | 'low';
  bitrate: number;
  format: 'mp3' | 'wav' | 'aac';
}

export interface AppError {
  type: 'validation' | 'conversion' | 'network' | 'unknown';
  message: string;
  code?: string;
  details?: unknown;
}

export type ConversionStatus = 'idle' | 'preparing' | 'converting' | 'complete' | 'error';

// Component Props Types
export interface FileUploadProps {
  onFileSelect: (file: File) => void;
  acceptedFormats?: string;
  disabled?: boolean;
}

export interface ConversionProgressProps {
  progress: ConversionProgress;
}

export interface DownloadButtonProps {
  audioFile: AudioFile | null;
  disabled?: boolean;
}

export interface ErrorDisplayProps {
  error: AppError | null;
  onDismiss?: () => void;
}

// FFmpeg-specific types
export interface FFmpegConversionState {
  isLoading: boolean;
  isConverting: boolean;
  progress: number;
  error: string | null;
  result: { data: Uint8Array; filename: string } | null;
}

export interface ConversionResult {
  audioBlob: Blob;
  filename: string;
  size: number;
  duration?: number;
}

export interface FFmpegWorkerMessage {
  type: 'progress' | 'success' | 'error';
  progress?: number;
  data?: Uint8Array;
  filename?: string;
  message?: string;
}