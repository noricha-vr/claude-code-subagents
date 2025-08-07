import type { 
  VideoFile, 
  ConvertedFile, 
  ConversionProgress, 
  ConversionResult, 
  ConversionStatus 
} from '@/types';
import { FFmpegService } from './ffmpeg';
import { ErrorHandler } from '@/utils/errorHandler';

export interface BatchProcessingOptions {
  maxConcurrentJobs?: number;
  onFileProgress?: (progress: ConversionProgress) => void;
  onFileComplete?: (result: ConversionResult) => void;
  onBatchProgress?: (completed: number, total: number, currentFile?: string) => void;
  onBatchComplete?: (results: ConversionResult[]) => void;
  onError?: (error: Error, fileId?: string) => void;
}

export interface BatchProcessingResult {
  success: boolean;
  results: ConversionResult[];
  errors: { fileId: string; error: Error }[];
  totalTime: number;
}

export class BatchProcessor {
  private ffmpegService: FFmpegService;
  private isProcessing = false;
  private currentJobs: Map<string, Promise<ConversionResult>> = new Map();
  private abortController?: AbortController;

  constructor(ffmpegService?: FFmpegService) {
    this.ffmpegService = ffmpegService || new FFmpegService();
  }

  async processBatch(
    files: VideoFile[],
    options: BatchProcessingOptions = {}
  ): Promise<BatchProcessingResult> {
    if (this.isProcessing) {
      throw new Error('Batch processing already in progress');
    }

    const {
      maxConcurrentJobs = 2,
      onFileProgress,
      onFileComplete,
      onBatchProgress,
      onBatchComplete,
      onError
    } = options;

    this.isProcessing = true;
    this.abortController = new AbortController();
    const startTime = Date.now();
    const results: ConversionResult[] = [];
    const errors: { fileId: string; error: Error }[] = [];

    try {
      // Initialize FFmpeg if not ready
      if (!this.ffmpegService.ready) {
        await this.ffmpegService.initialize();
      }

      // Process files in batches
      const fileQueue = [...files];
      let completed = 0;

      while (fileQueue.length > 0 && !this.abortController.signal.aborted) {
        // Start concurrent jobs up to the limit
        const currentBatch = fileQueue.splice(0, maxConcurrentJobs);
        const batchPromises: Promise<void>[] = [];

        for (const file of currentBatch) {
          const jobPromise = this.processFile(
            file,
            onFileProgress,
            this.abortController.signal
          ).then(result => {
            if (result.success) {
              results.push(result);
            } else if (result.error) {
              errors.push({ fileId: file.id, error: new Error(result.error.message) });
              onError?.(new Error(result.error.message), file.id);
            }

            onFileComplete?.(result);
            completed++;
            onBatchProgress?.(completed, files.length, file.name);
          }).catch(error => {
            const errorObj = error instanceof Error ? error : new Error(String(error));
            errors.push({ fileId: file.id, error: errorObj });
            onError?.(errorObj, file.id);
            completed++;
            onBatchProgress?.(completed, files.length, file.name);
          });

          batchPromises.push(jobPromise);
        }

        // Wait for current batch to complete
        await Promise.allSettled(batchPromises);
      }

      const batchResult: BatchProcessingResult = {
        success: errors.length === 0,
        results,
        errors,
        totalTime: Date.now() - startTime
      };

      onBatchComplete?.(results);
      return batchResult;

    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error(String(error));
      onError?.(errorObj);
      
      return {
        success: false,
        results,
        errors: [...errors, { fileId: 'batch', error: errorObj }],
        totalTime: Date.now() - startTime
      };
    } finally {
      this.isProcessing = false;
      this.currentJobs.clear();
      this.abortController = undefined;
    }
  }

  private async processFile(
    file: VideoFile,
    onProgress?: (progress: ConversionProgress) => void,
    signal?: AbortSignal
  ): Promise<ConversionResult> {
    if (signal?.aborted) {
      return {
        success: false,
        fileId: file.id,
        error: ErrorHandler.createError('user_cancelled', 'Processing was cancelled'),
        duration: 0
      };
    }

    const jobPromise = this.ffmpegService.convertToMP3(
      file.file,
      (progress) => {
        if (signal?.aborted) return;
        onProgress?.(progress);
      }
    );

    this.currentJobs.set(file.id, jobPromise);

    try {
      const result = await jobPromise;
      this.currentJobs.delete(file.id);
      return result;
    } catch (error) {
      this.currentJobs.delete(file.id);
      throw error;
    }
  }

  async cancelBatch(): Promise<void> {
    if (!this.isProcessing || !this.abortController) {
      return;
    }

    this.abortController.abort();

    // Wait for all current jobs to handle the cancellation
    const pendingJobs = Array.from(this.currentJobs.values());
    await Promise.allSettled(pendingJobs);

    this.isProcessing = false;
    this.currentJobs.clear();
  }

  get processing(): boolean {
    return this.isProcessing;
  }

  get activeJobs(): number {
    return this.currentJobs.size;
  }

  // Queue management for optimal performance
  static optimizeQueue(files: VideoFile[]): VideoFile[] {
    // Sort files by size (smaller files first for faster initial feedback)
    return [...files].sort((a, b) => a.size - b.size);
  }

  // Estimate batch processing time
  static estimateBatchTime(
    files: VideoFile[],
    averageConversionRate = 0.1 // seconds of video per second of processing
  ): number {
    // This is a rough estimation based on file sizes
    // In reality, you'd need more sophisticated metrics
    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    const averageFileSizeMB = totalSize / files.length / (1024 * 1024);
    
    // Very rough estimate: ~1MB video = ~30 seconds duration
    const estimatedTotalDuration = averageFileSizeMB * 30;
    const estimatedProcessingTime = estimatedTotalDuration * averageConversionRate;
    
    return Math.max(estimatedProcessingTime * 1000, files.length * 5000); // Minimum 5 seconds per file
  }

  // Get recommended concurrent job count based on system capabilities
  static getRecommendedConcurrency(): number {
    if (typeof navigator === 'undefined') return 1;
    
    // Check available memory
    const memory = (navigator as any).deviceMemory || 4; // Default to 4GB
    
    // Check CPU cores
    const cores = navigator.hardwareConcurrency || 4;
    
    // Conservative approach: use fewer concurrent jobs for lower-spec devices
    if (memory <= 2 || cores <= 2) return 1;
    if (memory <= 4 || cores <= 4) return 2;
    return Math.min(3, Math.floor(cores / 2));
  }

  // Progress aggregation for multiple files
  static calculateOverallProgress(
    fileProgresses: Map<string, ConversionProgress>
  ): { overall: number; activeFiles: number; completedFiles: number } {
    const progresses = Array.from(fileProgresses.values());
    const totalProgress = progresses.reduce((sum, p) => sum + p.progress, 0);
    const overallProgress = progresses.length > 0 ? totalProgress / progresses.length : 0;
    
    const completedFiles = progresses.filter(p => p.status === ConversionStatus.COMPLETED).length;
    const activeFiles = progresses.filter(p => p.status === ConversionStatus.PROCESSING).length;
    
    return {
      overall: Math.round(overallProgress),
      activeFiles,
      completedFiles
    };
  }
}