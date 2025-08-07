import { describe, it, expect } from 'vitest';
import { ErrorHandler } from '@/utils/errorHandler';
import type { ErrorType } from '@/types';

describe('ErrorHandler', () => {
  describe('createError', () => {
    it('should create error with correct properties', () => {
      const error = ErrorHandler.createError('file_too_large', 'Test message', 'Test details');
      
      expect(error.type).toBe('file_too_large');
      expect(error.message).toBe('Test message');
      expect(error.details).toBe('Test details');
      expect(error.recoverable).toBe(true);
    });

    it('should set recoverable flag correctly for different error types', () => {
      const recoverableError = ErrorHandler.createError('network_error', 'Network failed');
      const nonRecoverableError = ErrorHandler.createError('ffmpeg_load_failed', 'FFmpeg failed');
      
      expect(recoverableError.recoverable).toBe(true);
      expect(nonRecoverableError.recoverable).toBe(true); // FFmpeg load is actually recoverable
    });
  });

  describe('getUserFriendlyMessage', () => {
    it('should return appropriate messages for different error types', () => {
      const testCases: Array<[ErrorType, string]> = [
        ['file_too_large', 'File is too large to process'],
        ['unsupported_format', 'File format not supported'],
        ['ffmpeg_load_failed', 'Failed to load the video processor'],
        ['conversion_failed', 'Failed to convert the video file'],
        ['network_error', 'Network error occurred'],
        ['memory_error', 'Not enough memory to process this file'],
        ['user_cancelled', 'Conversion was cancelled by user']
      ];

      testCases.forEach(([errorType, expectedMessage]) => {
        const error = ErrorHandler.createError(errorType, 'Original message');
        const friendlyMessage = ErrorHandler.getUserFriendlyMessage(error);
        
        expect(friendlyMessage).toContain(expectedMessage);
      });
    });

    it('should return original message for unknown error types', () => {
      const error = ErrorHandler.createError('unknown_error' as ErrorType, 'Custom error message');
      const friendlyMessage = ErrorHandler.getUserFriendlyMessage(error);
      
      expect(friendlyMessage).toBe('Custom error message');
    });
  });

  describe('getActionableAdvice', () => {
    it('should return specific advice for file_too_large errors', () => {
      const error = ErrorHandler.createError('file_too_large', 'File too large');
      const advice = ErrorHandler.getActionableAdvice(error);
      
      expect(advice).toBeInstanceOf(Array);
      expect(advice.length).toBeGreaterThan(0);
      expect(advice.some(item => item.includes('compress'))).toBe(true);
    });

    it('should return specific advice for unsupported_format errors', () => {
      const error = ErrorHandler.createError('unsupported_format', 'Format not supported');
      const advice = ErrorHandler.getActionableAdvice(error);
      
      expect(advice).toBeInstanceOf(Array);
      expect(advice.some(item => item.includes('MP4'))).toBe(true);
    });

    it('should return specific advice for ffmpeg_load_failed errors', () => {
      const error = ErrorHandler.createError('ffmpeg_load_failed', 'FFmpeg failed to load');
      const advice = ErrorHandler.getActionableAdvice(error);
      
      expect(advice).toBeInstanceOf(Array);
      expect(advice.some(item => item.includes('refresh') || item.includes('Refresh'))).toBe(true);
    });

    it('should return general advice for unknown error types', () => {
      const error = ErrorHandler.createError('unknown_error' as ErrorType, 'Unknown error');
      const advice = ErrorHandler.getActionableAdvice(error);
      
      expect(advice).toBeInstanceOf(Array);
      expect(advice.length).toBeGreaterThan(0);
      expect(advice.some(item => item.includes('try again') || item.includes('Try again'))).toBe(true);
    });
  });

  describe('isRecoverable', () => {
    it('should correctly identify recoverable errors', () => {
      const recoverableTypes: ErrorType[] = [
        'file_too_large',
        'unsupported_format',
        'ffmpeg_load_failed',
        'conversion_failed',
        'network_error',
        'memory_error',
        'user_cancelled'
      ];

      recoverableTypes.forEach(type => {
        expect(ErrorHandler.isRecoverable(type)).toBe(true);
      });
    });
  });

  describe('shouldRetryAutomatically', () => {
    it('should return true only for network errors', () => {
      const networkError = ErrorHandler.createError('network_error', 'Network failed');
      const otherError = ErrorHandler.createError('conversion_failed', 'Conversion failed');
      
      expect(ErrorHandler.shouldRetryAutomatically(networkError)).toBe(true);
      expect(ErrorHandler.shouldRetryAutomatically(otherError)).toBe(false);
    });
  });

  describe('getRetryDelay', () => {
    it('should return exponential backoff delays', () => {
      expect(ErrorHandler.getRetryDelay(0)).toBe(1000); // 1 second
      expect(ErrorHandler.getRetryDelay(1)).toBe(2000); // 2 seconds
      expect(ErrorHandler.getRetryDelay(2)).toBe(4000); // 4 seconds
      expect(ErrorHandler.getRetryDelay(3)).toBe(8000); // 8 seconds
    });

    it('should cap delay at 30 seconds', () => {
      expect(ErrorHandler.getRetryDelay(10)).toBe(30000); // 30 seconds max
    });
  });

  describe('formatErrorForDisplay', () => {
    it('should format error with all required properties', () => {
      const error = ErrorHandler.createError('conversion_failed', 'Conversion failed', 'FFmpeg error');
      const formatted = ErrorHandler.formatErrorForDisplay(error);
      
      expect(formatted).toHaveProperty('title');
      expect(formatted).toHaveProperty('message');
      expect(formatted).toHaveProperty('details');
      expect(formatted).toHaveProperty('actions');
      expect(formatted).toHaveProperty('recoverable');
      
      expect(formatted.title).toBe('Conversion Failed');
      expect(formatted.details).toBe('FFmpeg error');
      expect(formatted.actions).toBeInstanceOf(Array);
      expect(formatted.recoverable).toBe(true);
    });

    it('should have appropriate titles for different error types', () => {
      const testCases: Array<[ErrorType, string]> = [
        ['file_too_large', 'File Too Large'],
        ['unsupported_format', 'Unsupported Format'],
        ['ffmpeg_load_failed', 'Loading Failed'],
        ['conversion_failed', 'Conversion Failed'],
        ['network_error', 'Network Error'],
        ['memory_error', 'Memory Error'],
        ['user_cancelled', 'Cancelled']
      ];

      testCases.forEach(([errorType, expectedTitle]) => {
        const error = ErrorHandler.createError(errorType, 'Test message');
        const formatted = ErrorHandler.formatErrorForDisplay(error);
        
        expect(formatted.title).toBe(expectedTitle);
      });
    });
  });
});