import type { ConversionError, ErrorType } from '@/types';

// Supported video formats
const SUPPORTED_VIDEO_FORMATS = [
  'video/mp4',
  'video/webm',
  'video/avi',
  'video/mov',
  'video/wmv',
  'video/flv',
  'video/mkv',
  'video/m4v',
  'video/3gp',
  'video/ogv'
];

const SUPPORTED_EXTENSIONS = [
  'mp4', 'webm', 'avi', 'mov', 'wmv', 'flv', 'mkv', 'm4v', '3gp', 'ogv'
];

// File size limits (in bytes)
const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500MB
const MIN_FILE_SIZE = 1024; // 1KB

export interface ValidationResult {
  isValid: boolean;
  error?: ConversionError;
}

export class FileValidator {
  static validateFile(file: File): ValidationResult {
    // Check file size
    const sizeValidation = this.validateFileSize(file);
    if (!sizeValidation.isValid) {
      return sizeValidation;
    }

    // Check file format
    const formatValidation = this.validateFileFormat(file);
    if (!formatValidation.isValid) {
      return formatValidation;
    }

    return { isValid: true };
  }

  static validateMultipleFiles(files: File[]): ValidationResult {
    if (files.length === 0) {
      return {
        isValid: false,
        error: {
          type: 'unsupported_format' as ErrorType,
          message: 'No files selected',
          recoverable: true
        }
      };
    }

    if (files.length > 10) {
      return {
        isValid: false,
        error: {
          type: 'file_too_large' as ErrorType,
          message: 'Too many files selected. Maximum 10 files allowed.',
          recoverable: true
        }
      };
    }

    // Validate each file
    for (const file of files) {
      const validation = this.validateFile(file);
      if (!validation.isValid) {
        return validation;
      }
    }

    // Check total size
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (totalSize > MAX_FILE_SIZE * 2) { // Allow 2x max for multiple files
      return {
        isValid: false,
        error: {
          type: 'file_too_large' as ErrorType,
          message: 'Total file size too large. Please select smaller files.',
          recoverable: true
        }
      };
    }

    return { isValid: true };
  }

  private static validateFileSize(file: File): ValidationResult {
    if (file.size > MAX_FILE_SIZE) {
      return {
        isValid: false,
        error: {
          type: 'file_too_large' as ErrorType,
          message: `File size too large. Maximum allowed size is ${this.formatFileSize(MAX_FILE_SIZE)}.`,
          details: `File size: ${this.formatFileSize(file.size)}`,
          recoverable: true
        }
      };
    }

    if (file.size < MIN_FILE_SIZE) {
      return {
        isValid: false,
        error: {
          type: 'file_too_large' as ErrorType,
          message: 'File size too small. File might be corrupted.',
          details: `File size: ${this.formatFileSize(file.size)}`,
          recoverable: true
        }
      };
    }

    return { isValid: true };
  }

  private static validateFileFormat(file: File): ValidationResult {
    const isValidMimeType = SUPPORTED_VIDEO_FORMATS.includes(file.type);
    const extension = this.getFileExtension(file.name);
    const isValidExtension = SUPPORTED_EXTENSIONS.includes(extension);

    if (!isValidMimeType && !isValidExtension) {
      return {
        isValid: false,
        error: {
          type: 'unsupported_format' as ErrorType,
          message: `Unsupported file format: ${file.type || 'unknown'}`,
          details: `Supported formats: ${SUPPORTED_EXTENSIONS.join(', ')}`,
          recoverable: true
        }
      };
    }

    return { isValid: true };
  }

  private static getFileExtension(filename: string): string {
    return filename.split('.').pop()?.toLowerCase() || '';
  }

  private static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  static getSupportedFormats(): string[] {
    return [...SUPPORTED_EXTENSIONS];
  }

  static getMaxFileSize(): number {
    return MAX_FILE_SIZE;
  }

  static formatFileSize = FileValidator.formatFileSize;
}