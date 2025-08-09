/**
 * ファイル処理ユーティリティ関数
 * 動画ファイルの検証と情報取得
 */

import type { VideoFile, FileValidationResult, SupportedVideoMimeTypes } from '../types';
import { SUPPORTED_VIDEO_TYPES, MAX_FILE_SIZE, ERROR_MESSAGES, FILE_EXTENSION_MAP, PERFORMANCE_CONFIG } from './constants';

/**
 * ファイルが動画形式かどうかを判定
 */
export const isVideoFile = (file: File): boolean => {
  // MIME typeで判定
  if (SUPPORTED_VIDEO_TYPES.includes(file.type as SupportedVideoMimeTypes)) {
    return true;
  }

  // 拡張子で判定（MIME typeが不正確な場合の fallback）
  const extension = getFileExtension(file.name).toLowerCase();
  return Object.keys(FILE_EXTENSION_MAP).includes(extension);
};

/**
 * ファイルサイズが制限内かどうかを判定
 */
export const isValidFileSize = (file: File): boolean => {
  return file.size <= MAX_FILE_SIZE;
};

/**
 * ファイル名から拡張子を取得
 */
export const getFileExtension = (filename: string): string => {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex > 0 ? filename.substring(lastDotIndex) : '';
};

/**
 * 動画ファイルの継続時間を取得（Promise版）
 * パフォーマンス最適化：タイムアウトとメモリ管理を改善
 */
export const getVideoDuration = (file: File, timeoutMs: number = 10000): Promise<number | undefined> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    let resolved = false;
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[getVideoDuration] Failed to revoke URL:', error);
          }
        }
      }
    };
    
    const handleSuccess = () => {
      if (!resolved) {
        const duration = video.duration;
        cleanup();
        resolve(duration && isFinite(duration) ? duration : undefined);
      }
    };
    
    const handleError = () => {
      if (!resolved) {
        cleanup();
        resolve(undefined);
      }
    };
    
    // タイムアウト設定
    const timeoutId = setTimeout(() => {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[getVideoDuration] Timeout after', timeoutMs, 'ms');
      }
      handleError();
    }, timeoutMs);
    
    video.addEventListener('loadedmetadata', () => {
      clearTimeout(timeoutId);
      handleSuccess();
    }, { once: true });
    
    video.addEventListener('error', () => {
      clearTimeout(timeoutId);
      handleError();
    }, { once: true });
    
    video.preload = 'metadata';
    video.src = url;
  });
};

/**
 * 動画ファイルのプレビューURL（thumbnail）を生成
 * パフォーマンス最適化：高品質サムネイル生成とメモリ管理
 */
export const generateVideoPreview = (
  file: File, 
  maxWidth: number = 320, 
  maxHeight: number = 240,
  quality: number = 0.8,
  seekTime: number = 1,
  timeoutMs: number = 15000
): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const url = URL.createObjectURL(file);
    let resolved = false;
    
    const cleanup = () => {
      if (!resolved) {
        resolved = true;
        try {
          URL.revokeObjectURL(url);
        } catch (error) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('[generateVideoPreview] Failed to revoke URL:', error);
          }
        }
      }
    };
    
    const handleError = (context?: string) => {
      if (!resolved) {
        if (process.env.NODE_ENV === 'development' && context) {
          console.warn(`[generateVideoPreview] Error in ${context}`);
        }
        cleanup();
        resolve(undefined);
      }
    };
    
    // タイムアウト設定
    const timeoutId = setTimeout(() => {
      handleError('timeout');
    }, timeoutMs);
    
    video.addEventListener('loadedmetadata', () => {
      if (resolved) return;
      
      try {
        // アスペクト比を保持してサイズ調整
        const aspectRatio = video.videoWidth / video.videoHeight;
        let width = Math.min(video.videoWidth, maxWidth);
        let height = Math.min(video.videoHeight, maxHeight);
        
        if (width / height > aspectRatio) {
          width = height * aspectRatio;
        } else {
          height = width / aspectRatio;
        }
        
        canvas.width = Math.round(width);
        canvas.height = Math.round(height);
        
        // シーク時間を動画の長さに合わせて調整
        const actualSeekTime = Math.min(seekTime, video.duration * 0.1, video.duration - 0.5);
        video.currentTime = Math.max(0, actualSeekTime);
      } catch (error) {
        handleError('metadata processing');
      }
    }, { once: true });
    
    video.addEventListener('seeked', () => {
      if (resolved) return;
      
      try {
        const ctx = canvas.getContext('2d');
        if (ctx) {
          // 高品質レンダリング設定
          ctx.imageSmoothingEnabled = true;
          ctx.imageSmoothingQuality = 'high';
          
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          const dataURL = canvas.toDataURL('image/jpeg', quality);
          
          clearTimeout(timeoutId);
          cleanup();
          resolve(dataURL);
        } else {
          handleError('canvas context');
        }
      } catch (error) {
        handleError('canvas rendering');
      }
    }, { once: true });
    
    video.addEventListener('error', () => {
      clearTimeout(timeoutId);
      handleError('video loading');
    }, { once: true });
    
    video.preload = 'metadata';
    video.muted = true;
    video.src = url;
  });
};

/**
 * ファイルを VideoFile オブジェクトに変換
 * パフォーマンス最適化：タイムアウトとエラーハンドリング改善
 */
export const createVideoFile = async (file: File): Promise<VideoFile> => {
  // MIME typeの正規化（拡張子から推定）
  let normalizedType = file.type;
  if (!normalizedType || !SUPPORTED_VIDEO_TYPES.includes(normalizedType as SupportedVideoMimeTypes)) {
    const extension = getFileExtension(file.name).toLowerCase();
    normalizedType = FILE_EXTENSION_MAP[extension] || file.type;
  }

  const videoFile: VideoFile = {
    file,
    name: file.name.substring(0, file.name.lastIndexOf('.')) || file.name,
    size: file.size,
    type: normalizedType
  };

  try {
    // ファイルサイズに基づいたタイムアウト調整（定数を使用）
    const fileSizeMB = file.size / (1024 * 1024);
    const durationTimeout = Math.max(
      PERFORMANCE_CONFIG.METADATA_TIMEOUT_BASE_MS, 
      Math.min(
        PERFORMANCE_CONFIG.MAX_METADATA_TIMEOUT_MS, 
        fileSizeMB * PERFORMANCE_CONFIG.METADATA_TIMEOUT_PER_MB
      )
    );
    const previewTimeout = Math.max(
      PERFORMANCE_CONFIG.PREVIEW_TIMEOUT_BASE_MS,
      Math.min(
        PERFORMANCE_CONFIG.MAX_PREVIEW_TIMEOUT_MS,
        fileSizeMB * PERFORMANCE_CONFIG.PREVIEW_TIMEOUT_PER_MB
      )
    );
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[createVideoFile] Processing ${file.name} (${fileSizeMB.toFixed(1)}MB)`, {
        durationTimeout,
        previewTimeout
      });
    }
    
    // 継続時間とプレビューを並行取得（最適化されたタイムアウト）
    const results = await Promise.allSettled([
      getVideoDuration(file, durationTimeout),
      generateVideoPreview(file, 320, 240, 0.8, 1, previewTimeout)
    ]);

    const duration = results[0].status === 'fulfilled' ? results[0].value : undefined;
    const previewUrl = results[1].status === 'fulfilled' ? results[1].value : undefined;

    if (duration !== undefined) {
      videoFile.duration = duration;
    }
    if (previewUrl) {
      videoFile.previewUrl = previewUrl;
    }
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[createVideoFile] Metadata extraction completed:`, {
        fileName: file.name,
        duration: duration ? `${duration.toFixed(1)}s` : 'unknown',
        hasPreview: !!previewUrl,
        previewSize: previewUrl ? `${Math.round(previewUrl.length / 1024)}KB` : 'none'
      });
    }
  } catch (error) {
    // メタデータ取得に失敗してもVideoFileは返す
    if (process.env.NODE_ENV === 'development') {
      console.warn('[createVideoFile] 動画メタデータの取得に失敗:', error);
    }
  }

  return videoFile;
};

/**
 * ファイル検証を実行
 */
export const validateFile = async (file: File): Promise<FileValidationResult> => {
  // ファイル形式チェック
  if (!isVideoFile(file)) {
    return {
      isValid: false,
      errorMessage: ERROR_MESSAGES.UNSUPPORTED_FORMAT
    };
  }

  // ファイルサイズチェック
  if (!isValidFileSize(file)) {
    return {
      isValid: false,
      errorMessage: ERROR_MESSAGES.FILE_TOO_LARGE
    };
  }

  try {
    // VideoFileオブジェクト作成
    const videoFile = await createVideoFile(file);
    
    return {
      isValid: true,
      videoFile
    };
  } catch (error) {
    return {
      isValid: false,
      errorMessage: ERROR_MESSAGES.FILE_READ_FAILED
    };
  }
};

/**
 * 複数ファイルの検証（最初の有効なファイルを返す）
 */
export const validateFiles = async (files: FileList | File[]): Promise<FileValidationResult> => {
  const fileArray = Array.from(files);
  
  if (fileArray.length === 0) {
    return {
      isValid: false,
      errorMessage: 'ファイルが選択されていません'
    };
  }

  // 最初の有効なファイルを検索
  for (const file of fileArray) {
    const result = await validateFile(file);
    if (result.isValid) {
      return result;
    }
  }

  return {
    isValid: false,
    errorMessage: ERROR_MESSAGES.UNSUPPORTED_FORMAT
  };
};

/**
 * ArrayBufferをファイルとして保存（ダウンロード）
 */
export const downloadArrayBuffer = (
  buffer: ArrayBuffer,
  filename: string,
  mimeType: string = 'audio/mp3'
): void => {
  const blob = new Blob([buffer], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // メモリリーク防止
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * ファイルサイズを読みやすい形式でフォーマット
 */
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/**
 * 秒数を時間:分:秒形式でフォーマット
 * パフォーマンス最適化：エッジケースと精度改善
 */
export const formatDuration = (seconds: number): string => {
  if (!seconds || !isFinite(seconds) || seconds < 0) return '不明';
  
  // 非常に短い動画（1秒未満）の場合
  if (seconds < 1) {
    return '0:01';
  }
  
  // 非常に長い動画（24時間以上）の場合
  if (seconds >= 86400) {
    const days = Math.floor(seconds / 86400);
    const remainingHours = Math.floor((seconds % 86400) / 3600);
    return `${days}日${remainingHours}時間+`;
  }
  
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * 時間を人間が読みやすい形式でフォーマット（残り時間用）
 */
export const formatTimeRemaining = (milliseconds: number): string => {
  if (!milliseconds || milliseconds <= 0 || !isFinite(milliseconds)) {
    return '';
  }
  
  const seconds = Math.ceil(milliseconds / 1000);
  
  if (seconds < 60) {
    return `残り ${seconds}秒`;
  }
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return `残り ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `残り ${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
};

/**
 * ファイルサイズに基づいた処理時間の推定
 */
export const estimateProcessingTime = (fileSizeBytes: number, videoDurationSeconds?: number): number => {
  // ファイルサイズベースの推定（MBあたり約500ms）
  const fileSizeMB = fileSizeBytes / (1024 * 1024);
  let estimatedMs = fileSizeMB * 500;
  
  // 動画の長さで補正（秒あたり約200ms）
  if (videoDurationSeconds && videoDurationSeconds > 0) {
    const durationBasedMs = videoDurationSeconds * 200;
    estimatedMs = (estimatedMs + durationBasedMs) / 2;
  }
  
  // 3秒～180秒の範囲でクランプ
  return Math.max(3000, Math.min(180000, estimatedMs));
};