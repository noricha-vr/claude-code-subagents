import type { FileValidationResult, FileUploadConfig } from '../types';
import { FILE_UPLOAD_CONFIG, SUPPORTED_VIDEO_MIME_TYPES } from '../types';

/**
 * Validates if a file is a supported video format
 */
export function validateVideoFormat(file: File): FileValidationResult {
  const fileExtension = getFileExtension(file.name).toLowerCase();
  const mimeType = file.type.toLowerCase();

  // Check MIME type first (more reliable)
  if (mimeType && SUPPORTED_VIDEO_MIME_TYPES.includes(mimeType)) {
    return { isValid: true };
  }

  // Fallback to extension check
  if (FILE_UPLOAD_CONFIG.allowedFormats.includes(fileExtension)) {
    return { isValid: true };
  }

  return {
    isValid: false,
    error: `Unsupported file format. Please select a video file (${FILE_UPLOAD_CONFIG.allowedFormats.join(', ').toUpperCase()}).`
  };
}

/**
 * Validates file size against the maximum allowed size
 */
export function validateFileSize(file: File, config: FileUploadConfig = FILE_UPLOAD_CONFIG): FileValidationResult {
  if (file.size > config.maxFileSize) {
    const maxSizeMB = Math.round(config.maxFileSize / (1024 * 1024));
    const fileSizeMB = Math.round(file.size / (1024 * 1024));
    
    return {
      isValid: false,
      error: `File size too large (${fileSizeMB}MB). Maximum allowed size is ${maxSizeMB}MB.`
    };
  }

  return { isValid: true };
}

/**
 * Comprehensive file validation
 */
export function validateFile(file: File, config: FileUploadConfig = FILE_UPLOAD_CONFIG): FileValidationResult {
  // Check file size first (faster)
  const sizeValidation = validateFileSize(file, config);
  if (!sizeValidation.isValid) {
    return sizeValidation;
  }

  // Check file format
  const formatValidation = validateVideoFormat(file);
  if (!formatValidation.isValid) {
    return formatValidation;
  }

  return { isValid: true };
}

/**
 * Validates multiple files
 */
export function validateFiles(files: FileList | File[], config: FileUploadConfig = FILE_UPLOAD_CONFIG): {
  validFiles: File[];
  errors: Array<{ file: File; error: string }>;
} {
  const fileArray = Array.from(files);
  const validFiles: File[] = [];
  const errors: Array<{ file: File; error: string }> = [];

  // Check file count limit
  if (fileArray.length > config.maxFiles) {
    const excessFiles = fileArray.slice(config.maxFiles);
    excessFiles.forEach(file => {
      errors.push({
        file,
        error: `Too many files selected. Maximum ${config.maxFiles} files allowed.`
      });
    });
  }

  // Validate each file
  const filesToValidate = fileArray.slice(0, config.maxFiles);
  filesToValidate.forEach(file => {
    const validation = validateFile(file, config);
    if (validation.isValid) {
      validFiles.push(file);
    } else {
      errors.push({
        file,
        error: validation.error || 'Unknown validation error'
      });
    }
  });

  return { validFiles, errors };
}

/**
 * Gets file extension from filename
 */
export function getFileExtension(filename: string): string {
  const lastDotIndex = filename.lastIndexOf('.');
  return lastDotIndex >= 0 ? filename.slice(lastDotIndex + 1) : '';
}

/**
 * Formats file size to human readable format
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${(bytes / Math.pow(k, i)).toFixed(i === 0 ? 0 : 1)} ${sizes[i]}`;
}

/**
 * Generates a unique ID for file items
 */
export function generateFileId(file?: File): string {
  if (file) {
    // ファイルの内容に基づいた一貫したIDを生成
    return `${file.name}-${file.size}-${file.lastModified}`;
  }
  // フォールバック: ランダムID（後方互換性のため）
  return `file_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Creates a video preview by reading basic metadata
 */
export function createVideoPreview(file: File): Promise<{
  duration?: number;
  dimensions?: { width: number; height: number };
}> {
  return new Promise((resolve) => {
    const video = document.createElement('video');
    const url = URL.createObjectURL(file);

    video.preload = 'metadata';
    video.src = url;

    video.onloadedmetadata = () => {
      const preview = {
        duration: video.duration,
        dimensions: {
          width: video.videoWidth,
          height: video.videoHeight
        }
      };
      
      URL.revokeObjectURL(url);
      resolve(preview);
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve({}); // Return empty object instead of rejecting
    };

    // Timeout after 5 seconds
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve({}); // Return empty object on timeout
    }, 5000);
  });
}

/**
 * Checks if drag event contains valid files
 */
export function isDragEventValid(event: DragEvent): boolean {
  if (!event.dataTransfer) return false;
  
  const types = Array.from(event.dataTransfer.types);
  return types.includes('Files');
}

/**
 * Extracts files from drag event
 */
export function extractFilesFromDragEvent(event: DragEvent): File[] {
  if (!event.dataTransfer) return [];
  
  return Array.from(event.dataTransfer.files);
}