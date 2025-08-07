import { describe, it, expect } from 'vitest';
import { ProgressCalculator } from '@/utils/progressCalculator';
import { ConversionStatus } from '@/types';

describe('ProgressCalculator', () => {
  describe('calculateProgress', () => {
    it('should return correct progress for LOADING_FFMPEG status', () => {
      const progress = ProgressCalculator.calculateProgress(ConversionStatus.LOADING_FFMPEG, 50);
      expect(progress).toBe(50);
    });

    it('should return 100 for COMPLETED status', () => {
      const progress = ProgressCalculator.calculateProgress(ConversionStatus.COMPLETED);
      expect(progress).toBe(100);
    });

    it('should return 0 for ERROR status', () => {
      const progress = ProgressCalculator.calculateProgress(ConversionStatus.ERROR);
      expect(progress).toBe(0);
    });

    it('should return 0 for CANCELLED status', () => {
      const progress = ProgressCalculator.calculateProgress(ConversionStatus.CANCELLED);
      expect(progress).toBe(0);
    });

    it('should map time-based progress for PROCESSING status', () => {
      // 50% through a 100-second video should map to processing range
      const progress = ProgressCalculator.calculateProgress(
        ConversionStatus.PROCESSING,
        undefined,
        50, // current time
        100  // total duration
      );
      
      expect(progress).toBeGreaterThanOrEqual(20); // Min processing range
      expect(progress).toBeLessThanOrEqual(85);    // Max processing range
    });

    it('should use raw progress when time data is unavailable', () => {
      const progress = ProgressCalculator.calculateProgress(
        ConversionStatus.PROCESSING,
        60 // raw progress
      );
      
      // Should map 60% to processing range (20-85)
      expect(progress).toBeGreaterThanOrEqual(20);
      expect(progress).toBeLessThanOrEqual(85);
    });

    it('should return minimum processing progress when no data available', () => {
      const progress = ProgressCalculator.calculateProgress(ConversionStatus.PROCESSING);
      expect(progress).toBe(20); // Minimum processing range
    });
  });

  describe('getStepLabel', () => {
    it('should return custom label when provided', () => {
      const label = ProgressCalculator.getStepLabel(ConversionStatus.PROCESSING, 'Custom step');
      expect(label).toBe('Custom step');
    });

    it('should return appropriate default labels for each status', () => {
      const testCases: Array<[ConversionStatus, string]> = [
        [ConversionStatus.IDLE, 'Ready to convert'],
        [ConversionStatus.LOADING_FFMPEG, 'Loading converter...'],
        [ConversionStatus.PROCESSING, 'Converting to MP3...'],
        [ConversionStatus.COMPLETED, 'Conversion completed!'],
        [ConversionStatus.ERROR, 'Conversion failed'],
        [ConversionStatus.CANCELLED, 'Conversion cancelled']
      ];

      testCases.forEach(([status, expectedLabel]) => {
        const label = ProgressCalculator.getStepLabel(status);
        expect(label).toBe(expectedLabel);
      });
    });
  });

  describe('estimateTimeRemaining', () => {
    it('should return undefined for 0% progress', () => {
      const timeRemaining = ProgressCalculator.estimateTimeRemaining(0, 1000);
      expect(timeRemaining).toBeUndefined();
    });

    it('should return undefined for 100% progress', () => {
      const timeRemaining = ProgressCalculator.estimateTimeRemaining(100, 1000);
      expect(timeRemaining).toBeUndefined();
    });

    it('should calculate remaining time correctly', () => {
      // 50% done in 10 seconds = 20 seconds total = 10 seconds remaining
      const timeRemaining = ProgressCalculator.estimateTimeRemaining(50, 10000);
      expect(timeRemaining).toBe(10000);
    });

    it('should return undefined for very short remaining times', () => {
      // 99% done in 10 seconds = ~0.1 seconds remaining (too short to show)
      const timeRemaining = ProgressCalculator.estimateTimeRemaining(99, 10000);
      expect(timeRemaining).toBeUndefined();
    });

    it('should handle edge cases gracefully', () => {
      const timeRemaining = ProgressCalculator.estimateTimeRemaining(25, 1000);
      expect(timeRemaining).toBe(3000); // 4 seconds total - 1 second elapsed = 3 seconds remaining
    });
  });

  describe('calculateConversionSpeed', () => {
    it('should return 0 for zero elapsed time', () => {
      const speed = ProgressCalculator.calculateConversionSpeed(1000, 0);
      expect(speed).toBe(0);
    });

    it('should calculate bytes per second correctly', () => {
      const speed = ProgressCalculator.calculateConversionSpeed(2000, 2000); // 2000 bytes in 2 seconds
      expect(speed).toBe(1); // 1 byte per second
    });

    it('should handle fractional seconds', () => {
      const speed = ProgressCalculator.calculateConversionSpeed(1000, 500); // 1000 bytes in 0.5 seconds
      expect(speed).toBe(2000); // 2000 bytes per second
    });
  });

  describe('formatTimeRemaining', () => {
    it('should format milliseconds correctly', () => {
      expect(ProgressCalculator.formatTimeRemaining(500)).toBe('Less than a second');
      expect(ProgressCalculator.formatTimeRemaining(1000)).toBe('1 second');
      expect(ProgressCalculator.formatTimeRemaining(2500)).toBe('3 seconds');
      expect(ProgressCalculator.formatTimeRemaining(60000)).toBe('1 minute');
      expect(ProgressCalculator.formatTimeRemaining(90000)).toBe('1:30');
      expect(ProgressCalculator.formatTimeRemaining(3661000)).toBe('1:01:01'); // 1 hour, 1 minute, 1 second
    });

    it('should handle edge cases', () => {
      expect(ProgressCalculator.formatTimeRemaining(0)).toBe('Less than a second');
      expect(ProgressCalculator.formatTimeRemaining(59000)).toBe('59 seconds');
      expect(ProgressCalculator.formatTimeRemaining(61000)).toBe('1:01');
    });
  });

  describe('formatSpeed', () => {
    it('should format speeds in appropriate units', () => {
      expect(ProgressCalculator.formatSpeed(500)).toBe('500 B/s');
      expect(ProgressCalculator.formatSpeed(1024)).toBe('1.0 KB/s');
      expect(ProgressCalculator.formatSpeed(1536)).toBe('1.5 KB/s');
      expect(ProgressCalculator.formatSpeed(1024 * 1024)).toBe('1.0 MB/s');
      expect(ProgressCalculator.formatSpeed(1.5 * 1024 * 1024)).toBe('1.5 MB/s');
    });

    it('should handle zero and very small speeds', () => {
      expect(ProgressCalculator.formatSpeed(0)).toBe('0 B/s');
      expect(ProgressCalculator.formatSpeed(0.5)).toBe('1 B/s'); // Rounds up
    });
  });

  describe('createProgressUpdate', () => {
    it('should create complete progress update object', () => {
      const update = ProgressCalculator.createProgressUpdate(
        'test-file-id',
        ConversionStatus.PROCESSING,
        50,
        'Converting...',
        30,
        60,
        5000,
        1000
      );

      expect(update).toMatchObject({
        fileId: 'test-file-id',
        status: ConversionStatus.PROCESSING,
        currentStep: 'Converting...',
      });

      expect(update.progress).toBeGreaterThanOrEqual(0);
      expect(update.progress).toBeLessThanOrEqual(100);
      expect(typeof update.timeRemaining).toBe('number');
      expect(typeof update.speed).toBe('number');
    });

    it('should handle missing optional parameters', () => {
      const update = ProgressCalculator.createProgressUpdate(
        'test-file-id',
        ConversionStatus.PROCESSING
      );

      expect(update.fileId).toBe('test-file-id');
      expect(update.status).toBe(ConversionStatus.PROCESSING);
      expect(update.progress).toBe(20); // Default processing minimum
      expect(update.currentStep).toBe('Converting to MP3...');
      expect(update.timeRemaining).toBeUndefined();
      expect(update.speed).toBeUndefined();
    });
  });

  describe('getProgressColor', () => {
    it('should return correct colors for different progress levels', () => {
      expect(ProgressCalculator.getProgressColor(10)).toBe('bg-red-500');
      expect(ProgressCalculator.getProgressColor(30)).toBe('bg-yellow-500');
      expect(ProgressCalculator.getProgressColor(60)).toBe('bg-blue-500');
      expect(ProgressCalculator.getProgressColor(80)).toBe('bg-green-500');
    });

    it('should handle edge cases', () => {
      expect(ProgressCalculator.getProgressColor(0)).toBe('bg-red-500');
      expect(ProgressCalculator.getProgressColor(25)).toBe('bg-red-500');
      expect(ProgressCalculator.getProgressColor(50)).toBe('bg-yellow-500');
      expect(ProgressCalculator.getProgressColor(75)).toBe('bg-blue-500');
      expect(ProgressCalculator.getProgressColor(100)).toBe('bg-green-500');
    });
  });

  describe('getProgressAnimation', () => {
    it('should return appropriate animations for different statuses', () => {
      expect(ProgressCalculator.getProgressAnimation(ConversionStatus.PROCESSING)).toBe('animate-pulse');
      expect(ProgressCalculator.getProgressAnimation(ConversionStatus.COMPLETED)).toBe('animate-none');
      expect(ProgressCalculator.getProgressAnimation(ConversionStatus.ERROR)).toBe('animate-pulse');
      expect(ProgressCalculator.getProgressAnimation(ConversionStatus.IDLE)).toBe('animate-none');
    });
  });
});