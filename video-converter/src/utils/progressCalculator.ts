import type { ConversionProgress, ConversionStatus } from '@/types';

export class ProgressCalculator {
  private static readonly PROGRESS_STEPS = {
    INITIALIZING: { min: 0, max: 10, label: 'Initializing...' },
    LOADING_FILE: { min: 10, max: 20, label: 'Loading file...' },
    PROCESSING: { min: 20, max: 85, label: 'Converting to MP3...' },
    FINALIZING: { min: 85, max: 95, label: 'Finalizing...' },
    COMPLETED: { min: 95, max: 100, label: 'Completed!' }
  };

  static calculateProgress(
    status: ConversionStatus,
    rawProgress?: number,
    currentTime?: number,
    totalDuration?: number
  ): number {
    switch (status) {
      case ConversionStatus.LOADING_FFMPEG:
        return rawProgress || 5;

      case ConversionStatus.PROCESSING:
        if (currentTime && totalDuration && totalDuration > 0) {
          // Use actual time-based progress for more accurate estimation
          const timeProgress = Math.min((currentTime / totalDuration) * 100, 100);
          const mappedProgress = this.mapToRange(
            timeProgress,
            this.PROGRESS_STEPS.PROCESSING.min,
            this.PROGRESS_STEPS.PROCESSING.max
          );
          return Math.round(mappedProgress);
        }
        
        // Fallback to raw progress or estimated progress
        if (rawProgress !== undefined) {
          return this.mapToRange(
            rawProgress,
            this.PROGRESS_STEPS.PROCESSING.min,
            this.PROGRESS_STEPS.PROCESSING.max
          );
        }
        
        return this.PROGRESS_STEPS.PROCESSING.min;

      case ConversionStatus.COMPLETED:
        return 100;

      case ConversionStatus.ERROR:
      case ConversionStatus.CANCELLED:
        return 0;

      default:
        return rawProgress || 0;
    }
  }

  static getStepLabel(status: ConversionStatus, customLabel?: string): string {
    if (customLabel) return customLabel;

    switch (status) {
      case ConversionStatus.IDLE:
        return 'Ready to convert';
      case ConversionStatus.LOADING_FFMPEG:
        return 'Loading converter...';
      case ConversionStatus.PROCESSING:
        return 'Converting to MP3...';
      case ConversionStatus.COMPLETED:
        return 'Conversion completed!';
      case ConversionStatus.ERROR:
        return 'Conversion failed';
      case ConversionStatus.CANCELLED:
        return 'Conversion cancelled';
      default:
        return 'Processing...';
    }
  }

  static estimateTimeRemaining(
    progress: number,
    elapsedTime: number
  ): number | undefined {
    if (progress <= 0 || progress >= 100) return undefined;
    
    const estimatedTotalTime = (elapsedTime / progress) * 100;
    const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);
    
    // Don't show estimates for very short remaining times (< 2 seconds)
    return remainingTime > 2000 ? remainingTime : undefined;
  }

  static calculateConversionSpeed(
    processedBytes: number,
    elapsedTime: number
  ): number {
    if (elapsedTime <= 0) return 0;
    
    // Return bytes per second
    return processedBytes / (elapsedTime / 1000);
  }

  static formatTimeRemaining(milliseconds: number): string {
    if (milliseconds < 1000) return 'Less than a second';
    
    const seconds = Math.ceil(milliseconds / 1000);
    
    if (seconds < 60) {
      return `${seconds} second${seconds === 1 ? '' : 's'}`;
    }
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes < 60) {
      if (remainingSeconds === 0) {
        return `${minutes} minute${minutes === 1 ? '' : 's'}`;
      }
      return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${remainingMinutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  static formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) {
      return `${Math.round(bytesPerSecond)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(1)} MB/s`;
    }
  }

  static createProgressUpdate(
    fileId: string,
    status: ConversionStatus,
    rawProgress?: number,
    currentStep?: string,
    currentTime?: number,
    totalDuration?: number,
    elapsedTime?: number,
    processedBytes?: number
  ): ConversionProgress {
    const progress = this.calculateProgress(status, rawProgress, currentTime, totalDuration);
    const stepLabel = this.getStepLabel(status, currentStep);
    
    let timeRemaining: number | undefined;
    let speed: number | undefined;

    if (elapsedTime && status === ConversionStatus.PROCESSING) {
      timeRemaining = this.estimateTimeRemaining(progress, elapsedTime);
      
      if (processedBytes) {
        speed = this.calculateConversionSpeed(processedBytes, elapsedTime);
      }
    }

    return {
      fileId,
      status,
      progress: Math.round(progress),
      currentStep: stepLabel,
      timeRemaining,
      speed
    };
  }

  private static mapToRange(
    value: number,
    targetMin: number,
    targetMax: number,
    sourceMin: number = 0,
    sourceMax: number = 100
  ): number {
    const sourceRange = sourceMax - sourceMin;
    const targetRange = targetMax - targetMin;
    
    if (sourceRange === 0) return targetMin;
    
    const normalizedValue = (value - sourceMin) / sourceRange;
    const mappedValue = targetMin + (normalizedValue * targetRange);
    
    return Math.max(targetMin, Math.min(targetMax, mappedValue));
  }

  static getProgressColor(progress: number): string {
    if (progress < 25) return 'bg-red-500';
    if (progress < 50) return 'bg-yellow-500';
    if (progress < 75) return 'bg-blue-500';
    return 'bg-green-500';
  }

  static getProgressAnimation(status: ConversionStatus): string {
    switch (status) {
      case ConversionStatus.PROCESSING:
        return 'animate-pulse';
      case ConversionStatus.COMPLETED:
        return 'animate-none';
      case ConversionStatus.ERROR:
        return 'animate-pulse';
      default:
        return 'animate-none';
    }
  }
}