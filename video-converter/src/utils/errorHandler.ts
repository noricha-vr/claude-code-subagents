import type { ConversionError, ErrorType } from '@/types';

export class ErrorHandler {
  static createError(
    type: ErrorType, 
    message: string, 
    details?: string
  ): ConversionError {
    return {
      type,
      message,
      details,
      recoverable: this.isRecoverable(type)
    };
  }

  static getUserFriendlyMessage(error: ConversionError): string {
    switch (error.type) {
      case 'file_too_large':
        return 'File is too large to process. Please select a smaller file (max 500MB).';
      
      case 'unsupported_format':
        return 'File format not supported. Please select a video file (MP4, AVI, MOV, etc.).';
      
      case 'ffmpeg_load_failed':
        return 'Failed to load the video processor. Please refresh the page and try again.';
      
      case 'conversion_failed':
        return 'Failed to convert the video file. The file might be corrupted or use an unsupported codec.';
      
      case 'network_error':
        return 'Network error occurred. Please check your connection and try again.';
      
      case 'memory_error':
        return 'Not enough memory to process this file. Try with a smaller file or close other tabs.';
      
      case 'user_cancelled':
        return 'Conversion was cancelled by user.';
      
      default:
        return error.message || 'An unknown error occurred. Please try again.';
    }
  }

  static getActionableAdvice(error: ConversionError): string[] {
    const advice: string[] = [];

    switch (error.type) {
      case 'file_too_large':
        advice.push('Try compressing your video before conversion');
        advice.push('Use a video editor to reduce file size');
        advice.push('Convert shorter video clips instead');
        break;
      
      case 'unsupported_format':
        advice.push('Convert your file to MP4 format first');
        advice.push('Use a different video file');
        advice.push('Check if the file is actually a video');
        break;
      
      case 'ffmpeg_load_failed':
        advice.push('Refresh the browser page');
        advice.push('Clear browser cache and cookies');
        advice.push('Try using a different browser');
        advice.push('Check your internet connection');
        break;
      
      case 'conversion_failed':
        advice.push('Try with a different video file');
        advice.push('Check if the video file is corrupted');
        advice.push('Ensure the video has an audio track');
        break;
      
      case 'memory_error':
        advice.push('Close other browser tabs');
        advice.push('Use a smaller video file');
        advice.push('Restart your browser');
        advice.push('Try on a device with more RAM');
        break;
      
      case 'network_error':
        advice.push('Check your internet connection');
        advice.push('Try again in a few moments');
        advice.push('Disable VPN if using one');
        break;
      
      default:
        advice.push('Refresh the page and try again');
        advice.push('Try with a different file');
        advice.push('Contact support if the problem persists');
    }

    return advice;
  }

  static isRecoverable(type: ErrorType): boolean {
    switch (type) {
      case 'ffmpeg_load_failed':
        return true;
      case 'conversion_failed':
        return true;
      case 'network_error':
        return true;
      case 'memory_error':
        return true;
      case 'file_too_large':
        return true;
      case 'unsupported_format':
        return true;
      case 'user_cancelled':
        return true;
      default:
        return false;
    }
  }

  static shouldRetryAutomatically(error: ConversionError): boolean {
    return error.type === 'network_error' && error.recoverable;
  }

  static getRetryDelay(attemptNumber: number): number {
    // Exponential backoff: 1s, 2s, 4s, 8s, max 30s
    return Math.min(1000 * Math.pow(2, attemptNumber), 30000);
  }

  static logError(error: ConversionError, context?: any): void {
    console.error(`[${error.type}] ${error.message}`, {
      details: error.details,
      recoverable: error.recoverable,
      context
    });

    // In production, you might want to send to error tracking service
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'exception', {
        description: `${error.type}: ${error.message}`,
        fatal: !error.recoverable
      });
    }
  }

  static formatErrorForDisplay(error: ConversionError): {
    title: string;
    message: string;
    details?: string;
    actions: string[];
    recoverable: boolean;
  } {
    return {
      title: this.getErrorTitle(error.type),
      message: this.getUserFriendlyMessage(error),
      details: error.details,
      actions: this.getActionableAdvice(error),
      recoverable: error.recoverable
    };
  }

  private static getErrorTitle(type: ErrorType): string {
    switch (type) {
      case 'file_too_large':
        return 'File Too Large';
      case 'unsupported_format':
        return 'Unsupported Format';
      case 'ffmpeg_load_failed':
        return 'Loading Failed';
      case 'conversion_failed':
        return 'Conversion Failed';
      case 'network_error':
        return 'Network Error';
      case 'memory_error':
        return 'Memory Error';
      case 'user_cancelled':
        return 'Cancelled';
      default:
        return 'Error';
    }
  }
}