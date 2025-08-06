// Video to MP3 Converter - File Validation Utilities

import { SUPPORTED_VIDEO_FORMATS, SUPPORTED_VIDEO_EXTENSIONS, MAX_FILE_SIZE, MIN_FILE_SIZE } from '../config/constants';
import { ErrorMessages } from './errorHandler';

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

export function validateVideoFile(file: File): ValidationResult {
  // ファイルサイズチェック
  if (file.size > MAX_FILE_SIZE) {
    return {
      isValid: false,
      error: ErrorMessages.FILE_TOO_LARGE
    };
  }

  if (file.size < MIN_FILE_SIZE) {
    return {
      isValid: false,
      error: 'ファイルサイズが小さすぎます'
    };
  }

  // MIMEタイプチェック
  if (!SUPPORTED_VIDEO_FORMATS.includes(file.type as any)) {
    return {
      isValid: false,
      error: ErrorMessages.UNSUPPORTED_FORMAT
    };
  }

  // 拡張子チェック（追加検証）
  const fileExtension = getFileExtension(file.name).toLowerCase();
  if (!SUPPORTED_VIDEO_EXTENSIONS.some(ext => ext === fileExtension)) {
    return {
      isValid: false,
      error: ErrorMessages.UNSUPPORTED_FORMAT
    };
  }

  return { isValid: true };
}

export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex === -1 ? '' : filename.substring(lastDotIndex);
}

export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

export function isVideoFile(file: File): boolean {
  return SUPPORTED_VIDEO_FORMATS.includes(file.type as any) ||
         SUPPORTED_VIDEO_EXTENSIONS.some(ext => 
           file.name.toLowerCase().endsWith(ext)
         );
}

export function sanitizeFileName(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9.-_]/g, '_')
    .replace(/_+/g, '_')
    .replace(/^_|_$/g, '');
}