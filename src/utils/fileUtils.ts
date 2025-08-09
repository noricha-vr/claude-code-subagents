/**
 * ファイル処理ユーティリティ関数
 * 動画ファイルの検証と情報取得
 */

import type { VideoFile, FileValidationResult, SupportedVideoMimeTypes } from '../types';
import { SUPPORTED_VIDEO_TYPES, MAX_FILE_SIZE, ERROR_MESSAGES, FILE_EXTENSION_MAP } from './constants';

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
 */
export const getVideoDuration = (file: File): Promise<number | undefined> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);
    
    video.addEventListener('loadedmetadata', () => {
      URL.revokeObjectURL(url);
      resolve(video.duration || undefined);
    });
    
    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    });
    
    video.src = url;
  });
};

/**
 * 動画ファイルのプレビューURL（thumbnail）を生成
 */
export const generateVideoPreview = (file: File): Promise<string | undefined> => {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const canvas = document.createElement('canvas');
    const url = URL.createObjectURL(file);
    
    video.addEventListener('loadedmetadata', () => {
      // キャンバスサイズを設定
      canvas.width = Math.min(video.videoWidth, 320);
      canvas.height = Math.min(video.videoHeight, 240);
      
      // 1秒目のフレームを取得
      video.currentTime = 1;
    });
    
    video.addEventListener('seeked', () => {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataURL = canvas.toDataURL('image/jpeg', 0.8);
        resolve(dataURL);
      } else {
        resolve(undefined);
      }
      URL.revokeObjectURL(url);
    });
    
    video.addEventListener('error', () => {
      URL.revokeObjectURL(url);
      resolve(undefined);
    });
    
    video.src = url;
    video.muted = true; // サムネイル生成時は音声不要
  });
};

/**
 * ファイルを VideoFile オブジェクトに変換
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
    // 継続時間とプレビューを並行取得（失敗してもエラーにしない）
    const [duration, previewUrl] = await Promise.all([
      getVideoDuration(file).catch(() => undefined),
      generateVideoPreview(file).catch(() => undefined)
    ]);

    if (duration !== undefined) {
      videoFile.duration = duration;
    }
    if (previewUrl) {
      videoFile.previewUrl = previewUrl;
    }
  } catch (error) {
    // メタデータ取得に失敗してもVideoFileは返す
    console.warn('動画メタデータの取得に失敗:', error);
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