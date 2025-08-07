import { useState, useCallback, useRef } from 'react';
import type {
  ConversionResult,
  FileUploadItem,
  DownloadOptions,
  BatchDownloadOptions,
  DownloadProgress,
  BatchDownloadProgress,
  DownloadResult,
  BatchDownloadResult
} from '../types';
import {
  downloadSingleFile,
  downloadMultipleFiles,
  getDownloadableFiles,
  DownloadErrorClass
} from '../utils/download';
// Note: Future expansion - エラーハンドラーは将来の拡張用として準備済み
// import { useDownloadErrorHandler } from './useErrorHandler';
// import { AppError } from '../utils/errorUtils';

export interface UseDownloadOptions {
  defaultDownloadOptions?: DownloadOptions;
  defaultBatchOptions?: BatchDownloadOptions;
  onDownloadStart?: () => void;
  onDownloadProgress?: (progress: DownloadProgress | BatchDownloadProgress) => void;
  onDownloadComplete?: (result: DownloadResult | BatchDownloadResult) => void;
  onDownloadError?: (error: DownloadErrorClass) => void;
}

export interface UseDownloadReturn {
  // State
  isDownloading: boolean;
  progress: DownloadProgress | BatchDownloadProgress | null;
  lastResult: DownloadResult | BatchDownloadResult | null;
  lastError: DownloadErrorClass | null;
  
  // Actions
  downloadSingle: (file: ConversionResult, options?: DownloadOptions) => Promise<DownloadResult>;
  downloadBatch: (files: ConversionResult[], options?: BatchDownloadOptions) => Promise<BatchDownloadResult>;
  downloadFromUploadItems: (items: FileUploadItem[], options?: BatchDownloadOptions) => Promise<DownloadResult | BatchDownloadResult>;
  clearError: () => void;
  cancel: () => void;
  
  // Utils
  getDownloadableCount: (items: FileUploadItem[]) => number;
  canDownload: (items: FileUploadItem[]) => boolean;
  getEstimatedArchiveSize: (items: FileUploadItem[]) => number;
}

export function useDownload(options: UseDownloadOptions = {}): UseDownloadReturn {
  const {
    defaultDownloadOptions = {},
    defaultBatchOptions = {},
    onDownloadStart,
    onDownloadProgress,
    onDownloadComplete,
    onDownloadError
  } = options;

  // Note: エラーハンドラーは将来の拡張用として準備済み
  // 現在は既存のDownloadErrorClassシステムを使用

  // State
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | BatchDownloadProgress | null>(null);
  const [lastResult, setLastResult] = useState<DownloadResult | BatchDownloadResult | null>(null);
  const [lastError, setLastError] = useState<DownloadErrorClass | null>(null);
  
  // Ref for cancellation
  const abortControllerRef = useRef<AbortController | null>(null);

  // Internal progress handler
  const handleProgress = useCallback((progressData: DownloadProgress | BatchDownloadProgress) => {
    setProgress(progressData);
    onDownloadProgress?.(progressData);
  }, [onDownloadProgress]);

  // Internal completion handler
  const handleComplete = useCallback((result: DownloadResult | BatchDownloadResult) => {
    setLastResult(result);
    setLastError(null);
    onDownloadComplete?.(result);
  }, [onDownloadComplete]);

  // Internal error handler
  const handleError = useCallback((error: DownloadErrorClass) => {
    setLastError(error);
    setLastResult(null);
    onDownloadError?.(error);
  }, [onDownloadError]);

  // Download single file
  const downloadSingle = useCallback(async (
    file: ConversionResult,
    options: DownloadOptions = {}
  ): Promise<DownloadResult> => {
    if (isDownloading) {
      throw new DownloadErrorClass('DOWNLOAD_FAILED', 'Another download is already in progress');
    }

    try {
      setIsDownloading(true);
      setProgress(null);
      setLastError(null);
      abortControllerRef.current = new AbortController();
      
      onDownloadStart?.();

      const mergedOptions = { ...defaultDownloadOptions, ...options };
      const result = await downloadSingleFile(file, mergedOptions, handleProgress);
      
      handleComplete(result);
      return result;
      
    } catch (error) {
      const downloadError = error instanceof DownloadErrorClass ? error : new DownloadErrorClass(
        'DOWNLOAD_FAILED',
        error instanceof Error ? error.message : 'Unknown download error'
      );
      handleError(downloadError);
      throw downloadError;
    } finally {
      setIsDownloading(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  }, [
    isDownloading,
    defaultDownloadOptions,
    onDownloadStart,
    handleProgress,
    handleComplete,
    handleError
  ]);

  // Download multiple files
  const downloadBatch = useCallback(async (
    files: ConversionResult[],
    options: BatchDownloadOptions = {}
  ): Promise<BatchDownloadResult> => {
    if (isDownloading) {
      throw new DownloadErrorClass('DOWNLOAD_FAILED', 'Another download is already in progress');
    }

    try {
      setIsDownloading(true);
      setProgress(null);
      setLastError(null);
      abortControllerRef.current = new AbortController();
      
      onDownloadStart?.();

      const mergedOptions = { ...defaultBatchOptions, ...options };
      const result = await downloadMultipleFiles(files, mergedOptions, handleProgress);
      
      handleComplete(result);
      return result;
      
    } catch (error) {
      const downloadError = error instanceof DownloadErrorClass ? error : new DownloadErrorClass(
        'DOWNLOAD_FAILED',
        error instanceof Error ? error.message : 'Unknown download error'
      );
      handleError(downloadError);
      throw downloadError;
    } finally {
      setIsDownloading(false);
      setProgress(null);
      abortControllerRef.current = null;
    }
  }, [
    isDownloading,
    defaultBatchOptions,
    onDownloadStart,
    handleProgress,
    handleComplete,
    handleError
  ]);

  // Download from upload items
  const downloadFromUploadItems = useCallback(async (
    items: FileUploadItem[],
    options: BatchDownloadOptions = {}
  ): Promise<DownloadResult | BatchDownloadResult> => {
    const downloadableFiles = getDownloadableFiles(items);
    
    if (downloadableFiles.length === 0) {
      throw new DownloadErrorClass('FILE_NOT_FOUND', 'No downloadable files found');
    }
    
    if (downloadableFiles.length === 1) {
      return downloadSingle(downloadableFiles[0]);
    }
    
    return downloadBatch(downloadableFiles, options);
  }, [downloadSingle, downloadBatch]);

  // Clear error
  const clearError = useCallback(() => {
    setLastError(null);
  }, []);

  // Cancel download
  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsDownloading(false);
    setProgress(null);
  }, []);

  // Utility functions
  const getDownloadableCount = useCallback((items: FileUploadItem[]): number => {
    return getDownloadableFiles(items).length;
  }, []);

  const canDownload = useCallback((items: FileUploadItem[]): boolean => {
    return getDownloadableFiles(items).length > 0;
  }, []);

  const getEstimatedArchiveSize = useCallback((items: FileUploadItem[]): number => {
    return getDownloadableFiles(items).reduce((total, file) => {
      return total + (file.convertedData?.length || 0);
    }, 0);
  }, []);

  return {
    // State
    isDownloading,
    progress,
    lastResult,
    lastError,
    
    // Actions
    downloadSingle,
    downloadBatch,
    downloadFromUploadItems,
    clearError,
    cancel,
    
    // Utils
    getDownloadableCount,
    canDownload,
    getEstimatedArchiveSize
  };
}

export default useDownload;