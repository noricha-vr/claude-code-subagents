export interface ConversionProgress {
  phase: 'initializing' | 'ready' | 'loading' | 'converting' | 'complete' | 'error';
  progress: number; // 0-100
  message: string;
  eta?: number; // seconds
}

export interface ConversionResult {
  success: boolean;
  blob?: Blob;
  fileName?: string;
  error?: string;
  duration?: number; // conversion time in seconds
}

export interface VideoFile {
  file: File;
  name: string;
  size: number;
  duration?: number;
  format?: string;
}

export interface ConversionOptions {
  bitrate: number; // 128kbps fixed
  quality: 'standard' | 'high';
  metadata?: {
    title?: string;
    artist?: string;
    album?: string;
  };
}

export interface FFmpegWorkerMessage {
  type: 'load' | 'convert' | 'progress' | 'complete' | 'error' | 'terminate';
  payload?: unknown;
}

export interface WorkerResponse {
  type: 'load' | 'convert' | 'progress' | 'complete' | 'error' | 'terminate' | 'ready' | 'status' | 'terminated';
  payload?: unknown;
  error?: string;
}