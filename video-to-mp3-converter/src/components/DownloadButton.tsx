import React, { useState, useCallback } from 'react';
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
  downloadUtils,
  DownloadErrorClass
} from '../utils/download';

export interface DownloadButtonProps {
  // Data props
  uploadItems?: FileUploadItem[];
  conversionResults?: ConversionResult[];
  
  // Single file download props
  singleFile?: ConversionResult;
  downloadOptions?: DownloadOptions;
  
  // Batch download props
  batchDownloadOptions?: BatchDownloadOptions;
  enableBatchDownload?: boolean;
  
  // UI props
  variant?: 'primary' | 'secondary' | 'outline';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  className?: string;
  
  // Callback props
  onDownloadStart?: () => void;
  onDownloadProgress?: (progress: DownloadProgress | BatchDownloadProgress) => void;
  onDownloadComplete?: (result: DownloadResult | BatchDownloadResult) => void;
  onDownloadError?: (error: DownloadErrorClass) => void;
  
  // Content props
  children?: React.ReactNode;
  icon?: React.ReactNode;
  loadingIcon?: React.ReactNode;
  showProgress?: boolean;
  showFileCount?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  uploadItems = [],
  conversionResults = [],
  singleFile,
  downloadOptions = {},
  batchDownloadOptions = {},
  enableBatchDownload = true,
  variant = 'primary',
  size = 'md',
  disabled = false,
  className = '',
  onDownloadStart,
  onDownloadProgress,
  onDownloadComplete,
  onDownloadError,
  children,
  icon,
  loadingIcon,
  showProgress = true,
  showFileCount = true
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [progress, setProgress] = useState<DownloadProgress | BatchDownloadProgress | null>(null);

  // Get downloadable files
  const downloadableFiles = React.useMemo(() => {
    if (singleFile) {
      return [singleFile];
    }
    
    if (conversionResults.length > 0) {
      return conversionResults.filter(result => result.success && result.convertedData);
    }
    
    return getDownloadableFiles(uploadItems);
  }, [singleFile, conversionResults, uploadItems]);

  // Determine download mode
  const isBatchDownload = !singleFile && downloadableFiles.length > 1 && enableBatchDownload;
  const canDownload = downloadableFiles.length > 0 && !disabled;

  // Handle single file download
  const handleSingleDownload = useCallback(async (file: ConversionResult) => {
    try {
      setIsDownloading(true);
      onDownloadStart?.();

      const result = await downloadSingleFile(
        file,
        downloadOptions,
        showProgress ? (progress) => {
          setProgress(progress);
          onDownloadProgress?.(progress);
        } : undefined
      );

      onDownloadComplete?.(result);
    } catch (error) {
      const downloadError = error instanceof DownloadErrorClass ? error : new DownloadErrorClass(
        'DOWNLOAD_FAILED',
        error instanceof Error ? error.message : 'Unknown download error'
      );
      onDownloadError?.(downloadError);
    } finally {
      setIsDownloading(false);
      setProgress(null);
    }
  }, [downloadOptions, showProgress, onDownloadStart, onDownloadProgress, onDownloadComplete, onDownloadError]);

  // Handle batch download
  const handleBatchDownload = useCallback(async (files: ConversionResult[]) => {
    try {
      setIsDownloading(true);
      onDownloadStart?.();

      const result = await downloadMultipleFiles(
        files,
        batchDownloadOptions,
        showProgress ? (progress) => {
          setProgress(progress);
          onDownloadProgress?.(progress);
        } : undefined
      );

      onDownloadComplete?.(result);
    } catch (error) {
      const downloadError = error instanceof DownloadErrorClass ? error : new DownloadErrorClass(
        'DOWNLOAD_FAILED',
        error instanceof Error ? error.message : 'Unknown download error'
      );
      onDownloadError?.(downloadError);
    } finally {
      setIsDownloading(false);
      setProgress(null);
    }
  }, [batchDownloadOptions, showProgress, onDownloadStart, onDownloadProgress, onDownloadComplete, onDownloadError]);

  // Main download handler
  const handleDownload = useCallback(() => {
    if (!canDownload || isDownloading) return;

    if (isBatchDownload) {
      handleBatchDownload(downloadableFiles);
    } else if (downloadableFiles.length === 1) {
      handleSingleDownload(downloadableFiles[0]);
    }
  }, [canDownload, isDownloading, isBatchDownload, downloadableFiles, handleBatchDownload, handleSingleDownload]);

  // Generate button content
  const getButtonContent = () => {
    if (children) {
      return children;
    }

    if (isDownloading) {
      if (isBatchDownload && progress && 'stage' in progress) {
        const batchProgress = progress as BatchDownloadProgress;
        switch (batchProgress.stage) {
          case 'preparing':
            return 'Preparing Download...';
          case 'creating_archive':
            return 'Creating Archive...';
          case 'downloading':
            return 'Downloading...';
          default:
            return 'Processing...';
        }
      }
      return 'Downloading...';
    }

    if (isBatchDownload) {
      const fileCount = downloadableFiles.length;
      return `Download All${showFileCount ? ` (${fileCount})` : ''}`;
    }

    if (downloadableFiles.length === 1) {
      const fileName = downloadUtils.generateDownloadFilename(
        downloadableFiles[0].originalFile.name,
        downloadOptions
      );
      return `Download ${fileName}`;
    }

    return 'Download';
  };

  // Generate button icon
  const getButtonIcon = () => {
    if (isDownloading) {
      return loadingIcon || (
        <svg className="animate-spin -ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="m12 2 4 4-4 4V2z"></path>
        </svg>
      );
    }

    return icon || (
      <svg className="-ml-1 mr-2 h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
      </svg>
    );
  };

  // Generate CSS classes
  const getButtonClasses = () => {
    const baseClasses = [
      'inline-flex items-center justify-center',
      'font-medium rounded-lg transition-all duration-200',
      'focus:outline-none focus:ring-2 focus:ring-offset-2',
      'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none'
    ];

    // Size classes
    const sizeClasses = {
      sm: 'px-3 py-1.5 text-sm',
      md: 'px-4 py-2 text-base',
      lg: 'px-6 py-3 text-lg'
    };

    // Variant classes
    const variantClasses = {
      primary: [
        'bg-blue-600 text-white border border-transparent',
        'hover:bg-blue-700 focus:ring-blue-500',
        'active:bg-blue-800'
      ],
      secondary: [
        'bg-gray-600 text-white border border-transparent',
        'hover:bg-gray-700 focus:ring-gray-500',
        'active:bg-gray-800'
      ],
      outline: [
        'bg-transparent text-blue-600 border border-blue-600',
        'hover:bg-blue-50 focus:ring-blue-500',
        'active:bg-blue-100 dark:text-blue-400 dark:border-blue-400',
        'dark:hover:bg-blue-900/20 dark:active:bg-blue-900/30'
      ]
    };

    return [
      ...baseClasses,
      sizeClasses[size],
      ...variantClasses[variant],
      className
    ].join(' ');
  };

  // Don't render if no downloadable files
  if (!canDownload && !isDownloading) {
    return null;
  }

  return (
    <div className="relative">
      <button
        type="button"
        className={getButtonClasses()}
        onClick={handleDownload}
        disabled={!canDownload || isDownloading}
        title={isBatchDownload ? `Download ${downloadableFiles.length} files as ZIP` : 'Download converted file'}
      >
        {getButtonIcon()}
        {getButtonContent()}
      </button>

      {/* Progress display */}
      {showProgress && isDownloading && progress && (
        <div className="absolute top-full left-0 right-0 mt-2 p-3 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-10">
          {'stage' in progress ? (
            <BatchProgressDisplay progress={progress as BatchDownloadProgress} />
          ) : (
            <SingleProgressDisplay progress={progress as DownloadProgress} />
          )}
        </div>
      )}
    </div>
  );
};

// Single file progress display component
const SingleProgressDisplay: React.FC<{ progress: DownloadProgress }> = ({ progress }) => (
  <div className="space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700 dark:text-gray-300">{progress.fileName}</span>
      <span className="text-gray-500 dark:text-gray-400">{progress.percentage}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress.percentage}%` }}
      />
    </div>
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>{downloadUtils.formatFileSize(progress.bytesDownloaded)} / {downloadUtils.formatFileSize(progress.totalBytes)}</span>
      {progress.speed && <span>{progress.speed}</span>}
    </div>
  </div>
);

// Batch download progress display component
const BatchProgressDisplay: React.FC<{ progress: BatchDownloadProgress }> = ({ progress }) => (
  <div className="space-y-3">
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700 dark:text-gray-300">
        {progress.stage === 'preparing' && 'Preparing files...'}
        {progress.stage === 'creating_archive' && 'Creating ZIP archive...'}
        {progress.stage === 'downloading' && 'Starting download...'}
        {progress.stage === 'completed' && 'Download complete!'}
        {progress.stage === 'error' && 'Download failed'}
      </span>
      <span className="text-gray-500 dark:text-gray-400">{progress.overallPercentage}%</span>
    </div>
    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${progress.overallPercentage}%` }}
      />
    </div>
    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
      <span>{progress.completedFiles} / {progress.totalFiles} files</span>
      {progress.archiveSize > 0 && (
        <span>Archive: {downloadUtils.formatFileSize(progress.archiveSize)}</span>
      )}
    </div>
    {progress.currentFile && (
      <div className="text-xs text-gray-600 dark:text-gray-400 truncate">
        Current: {progress.currentFile}
      </div>
    )}
  </div>
);

export default DownloadButton;