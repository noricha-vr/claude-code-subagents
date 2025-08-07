import { useCallback, useEffect, useRef, useState } from 'react';
import { FFmpegWorkerManager } from '../utils/ffmpegWorkerManager';
import type { ConversionOptions, ConversionResult } from '../utils/ffmpegWorkerManager';
import type { FileUploadItem } from '../types/index';

export interface UseFFmpegWorkerResult {
  // State
  isInitialized: boolean;
  isInitializing: boolean;
  isConverting: boolean;
  error: string | null;
  
  // Functions
  initialize: () => Promise<void>;
  convertFile: (file: FileUploadItem, options?: ConversionOptions) => Promise<ConversionResult>;
  convertMultipleFiles: (files: FileUploadItem[], options?: Omit<ConversionOptions, 'onProgress'>) => Promise<ConversionResult[]>;
  clearError: () => void;
  terminate: () => void;
  
  // Status
  getStatus: () => Promise<{
    initialized: boolean;
    initializing: boolean;
    error: string | null;
  }>;
}

export interface ConversionProgress {
  fileId: string;
  progress: number;
  time?: string;
}

export interface UseFFmpegWorkerOptions {
  autoInitialize?: boolean;
  onProgress?: (progress: ConversionProgress) => void;
  onConversionStart?: (fileId: string) => void;
  onConversionComplete?: (fileId: string, result: ConversionResult) => void;
  onConversionError?: (fileId: string, error: Error) => void;
  onInitializationComplete?: () => void;
  onInitializationError?: (error: Error) => void;
}

export function useFFmpegWorker(options: UseFFmpegWorkerOptions = {}): UseFFmpegWorkerResult {
  const {
    autoInitialize = false,
    onProgress,
    onConversionStart,
    onConversionComplete,
    onConversionError,
    onInitializationComplete,
    onInitializationError,
  } = options;

  // State
  const [isInitialized, setIsInitialized] = useState(false);
  const [isInitializing, setIsInitializing] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const workerManagerRef = useRef<FFmpegWorkerManager | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Initialize worker manager
  useEffect(() => {
    if (!workerManagerRef.current) {
      try {
        workerManagerRef.current = new FFmpegWorkerManager();
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to create FFmpeg worker manager';
        setError(errorMessage);
        onInitializationError?.(err instanceof Error ? err : new Error(errorMessage));
        return;
      }
    }

    // Auto-initialize if requested
    if (autoInitialize && !isInitialized && !isInitializing) {
      initialize();
    }

    // Cleanup function
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      if (workerManagerRef.current) {
        workerManagerRef.current.destroy();
        workerManagerRef.current = null;
      }
    };
  }, [autoInitialize, isInitialized, isInitializing]);

  const initialize = useCallback(async (): Promise<void> => {
    if (isInitialized || isInitializing) {
      return;
    }

    if (!workerManagerRef.current) {
      const errorMessage = 'Worker manager is not available';
      setError(errorMessage);
      throw new Error(errorMessage);
    }

    setIsInitializing(true);
    setError(null);

    try {
      await workerManagerRef.current.initialize();
      setIsInitialized(true);
      onInitializationComplete?.();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to initialize FFmpeg worker';
      setError(errorMessage);
      onInitializationError?.(err instanceof Error ? err : new Error(errorMessage));
      throw err;
    } finally {
      setIsInitializing(false);
    }
  }, [isInitialized, isInitializing, onInitializationComplete, onInitializationError]);

  const convertFile = useCallback(async (
    file: FileUploadItem,
    options: ConversionOptions = {}
  ): Promise<ConversionResult> => {
    if (!workerManagerRef.current) {
      throw new Error('Worker manager is not available');
    }

    if (!isInitialized) {
      await initialize();
    }

    setIsConverting(true);
    setError(null);

    // Create abort controller for this conversion
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      onConversionStart?.(file.id);

      const conversionOptions: ConversionOptions = {
        ...options,
        signal: abortController.signal,
        onProgress: (progress: number, time?: string) => {
          onProgress?.({ fileId: file.id, progress, time });
          options.onProgress?.(progress, time);
        },
      };

      const result = await workerManagerRef.current.convertVideoToMP3(file.file, conversionOptions);

      onConversionComplete?.(file.id, result);
      return result;

    } catch (err) {
      const error = err instanceof Error ? err : new Error('Conversion failed');
      setError(error.message);
      onConversionError?.(file.id, error);
      throw error;
    } finally {
      setIsConverting(false);
      abortControllerRef.current = null;
    }
  }, [isInitialized, initialize, onProgress, onConversionStart, onConversionComplete, onConversionError]);

  const convertMultipleFiles = useCallback(async (
    files: FileUploadItem[],
    options: Omit<ConversionOptions, 'onProgress'> = {}
  ): Promise<ConversionResult[]> => {
    const results: ConversionResult[] = [];
    const errors: { file: FileUploadItem; error: Error }[] = [];

    // Process files sequentially to avoid overwhelming the system
    for (const file of files) {
      try {
        const fileOptions: ConversionOptions = {
          ...options,
          onProgress: (progress: number, time?: string) => {
            onProgress?.({ fileId: file.id, progress, time });
          },
        };

        const result = await convertFile(file, fileOptions);
        results.push(result);
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Conversion failed');
        errors.push({ file, error: err });
      }
    }

    // If there were errors, throw a combined error
    if (errors.length > 0) {
      const errorMessage = `Failed to convert ${errors.length} out of ${files.length} files:\n` +
        errors.map(({ file, error }) => `- ${file.name}: ${error.message}`).join('\n');
      
      const combinedError = new Error(errorMessage);
      (combinedError as any).partialResults = results;
      (combinedError as any).failedFiles = errors;
      
      throw combinedError;
    }

    return results;
  }, [convertFile, onProgress]);

  const getStatus = useCallback(async () => {
    if (!workerManagerRef.current) {
      return {
        initialized: false,
        initializing: false,
        error: 'Worker manager not available',
      };
    }

    try {
      return await workerManagerRef.current.getStatus();
    } catch (err) {
      return {
        initialized: isInitialized,
        initializing: isInitializing,
        error: err instanceof Error ? err.message : 'Failed to get status',
      };
    }
  }, [isInitialized, isInitializing]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const terminate = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (workerManagerRef.current) {
      workerManagerRef.current.terminate();
    }

    setIsInitialized(false);
    setIsInitializing(false);
    setIsConverting(false);
    setError(null);
  }, []);

  return {
    // State
    isInitialized,
    isInitializing,
    isConverting,
    error,
    
    // Functions
    initialize,
    convertFile,
    convertMultipleFiles,
    clearError,
    terminate,
    getStatus,
  };
}

export default useFFmpegWorker;