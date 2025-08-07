import React, { useState, useRef, useCallback } from 'react';
import type { 
  FileUploadItem
} from '../types';
import { 
  validateFiles, 
  formatFileSize, 
  generateFileId, 
  createVideoPreview,
  isDragEventValid,
  extractFilesFromDragEvent
} from '../utils/fileValidation';
import { useApp } from '../context/AppContext';

interface FileUploadProps {
  className?: string;
  disabled?: boolean;
  onFilesSelected?: (files: FileUploadItem[]) => void;
  onFileRemove?: (fileId: string) => void;
  maxFiles?: number;
}

interface DragState {
  isDragOver: boolean;
  isDragActive: boolean;
  dragCounter: number;
}

const FileUpload: React.FC<FileUploadProps> = ({
  className = '',
  disabled = false,
  onFilesSelected,
  onFileRemove,
  maxFiles = 10
}) => {
  const { state, actions } = useApp();
  const [dragState, setDragState] = useState<DragState>({
    isDragOver: false,
    isDragActive: false,
    dragCounter: 0
  });
  const [uploadedFiles, setUploadedFiles] = useState<FileUploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropZoneRef = useRef<HTMLDivElement>(null);

  // Handle file selection and validation
  const processFiles = useCallback(async (files: FileList | File[]) => {
    if (disabled || isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const { validFiles, errors } = validateFiles(files);
      
      // Show validation errors
      errors.forEach(({ file, error }) => {
        actions.setError(`${file.name}: ${error}`);
      });
      
      if (validFiles.length === 0) {
        setIsProcessing(false);
        return;
      }

      // Create file upload items with preview generation
      const fileUploadItems: FileUploadItem[] = [];
      
      for (const file of validFiles) {
        const fileId = generateFileId(file);
        
        const fileItem: FileUploadItem = {
          id: fileId,
          file,
          name: file.name,
          size: file.size,
          type: file.type,
          status: 'pending'
        };

        // Generate video preview asynchronously
        try {
          const preview = await createVideoPreview(file);
          fileItem.preview = preview;
        } catch (error) {
          console.warn(`Failed to generate preview for ${file.name}:`, error);
        }

        fileUploadItems.push(fileItem);
      }

      // Update uploaded files list
      const newFiles = [...uploadedFiles, ...fileUploadItems];
      
      // Respect maxFiles limit
      const limitedFiles = newFiles.slice(0, maxFiles);
      if (newFiles.length > maxFiles) {
        actions.setError(`Only the first ${maxFiles} files were added. Maximum ${maxFiles} files allowed.`);
      }
      
      setUploadedFiles(limitedFiles);
      
      // Notify parent component
      if (onFilesSelected) {
        onFilesSelected(limitedFiles);
      }
      
      // Update global state
      actions.clearError();
      
    } catch (error) {
      console.error('Error processing files:', error);
      actions.setError('Failed to process selected files. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  }, [disabled, isProcessing, uploadedFiles, maxFiles, onFilesSelected, actions]);

  // Handle file input change
  const handleFileInputChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      processFiles(files);
    }
    // Reset input value to allow selecting the same file again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [processFiles]);

  // Handle file removal
  const handleFileRemove = useCallback((fileId: string) => {
    const newFiles = uploadedFiles.filter(file => file.id !== fileId);
    setUploadedFiles(newFiles);
    
    if (onFileRemove) {
      onFileRemove(fileId);
    }
    
    if (onFilesSelected) {
      onFilesSelected(newFiles);
    }
  }, [uploadedFiles, onFileRemove, onFilesSelected]);

  // Drag and drop event handlers
  const handleDragEnter = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    setDragState(prev => ({
      ...prev,
      dragCounter: prev.dragCounter + 1,
      isDragOver: true,
      isDragActive: isDragEventValid(event.nativeEvent)
    }));
  }, [disabled]);

  const handleDragLeave = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    setDragState(prev => {
      const newCounter = prev.dragCounter - 1;
      return {
        ...prev,
        dragCounter: newCounter,
        isDragOver: newCounter > 0,
        isDragActive: newCounter > 0 && isDragEventValid(event.nativeEvent)
      };
    });
  }, []);

  const handleDragOver = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    if (disabled) return;
    
    // Set the dropEffect to indicate what will happen on drop
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'copy';
    }
  }, [disabled]);

  const handleDrop = useCallback((event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    
    setDragState({
      isDragOver: false,
      isDragActive: false,
      dragCounter: 0
    });
    
    if (disabled) return;
    
    const files = extractFilesFromDragEvent(event.nativeEvent);
    if (files.length > 0) {
      processFiles(files);
    }
  }, [disabled, processFiles]);

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (disabled || isProcessing) return;
    
    fileInputRef.current?.click();
  }, [disabled, isProcessing]);

  // Format duration for display
  const formatDuration = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const dropZoneClasses = [
    'relative border-2 border-dashed rounded-lg sm:rounded-xl p-4 sm:p-6 lg:p-8 text-center transition-all duration-200 ease-in-out cursor-pointer',
    'min-h-[200px] sm:min-h-[250px] lg:min-h-[300px]', // レスポンシブな最小高さ
    dragState.isDragActive 
      ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' 
      : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500',
    disabled ? 'opacity-50 cursor-not-allowed' : '',
    isProcessing ? 'animate-pulse' : '',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className="w-full space-y-4">
      {/* Drop Zone */}
      <div
        ref={dropZoneRef}
        className={dropZoneClasses}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label="Upload video files"
        aria-describedby="upload-description"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleClick();
          }
        }}
      >
        {/* Upload Icon */}
        <div className="flex flex-col items-center space-y-3 sm:space-y-4">
          <div className="w-12 h-12 sm:w-16 sm:h-16 lg:w-20 lg:h-20 mx-auto bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            {isProcessing ? (
              <div className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 border-2 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
            ) : (
              <svg 
                className="w-6 h-6 sm:w-8 sm:h-8 lg:w-10 lg:h-10 text-gray-400 dark:text-gray-500" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" 
                />
              </svg>
            )}
          </div>
          
          {/* Upload Text */}
          <div className="space-y-2 max-w-sm sm:max-w-md lg:max-w-lg">
            <p className="text-base sm:text-lg lg:text-xl font-medium text-gray-900 dark:text-gray-100">
              {isProcessing ? 'Processing files...' : 'Drop video files here'}
            </p>
            <p id="upload-description" className="text-sm sm:text-base text-gray-500 dark:text-gray-400">
              or <span className="text-primary-600 dark:text-primary-400 font-medium">click to browse</span>
            </p>
            <p className="text-xs sm:text-sm text-gray-400 dark:text-gray-500 leading-relaxed">
              Supports: MP4, WebM, AVI, MOV, MKV<br className="sm:hidden" />
              <span className="hidden sm:inline"> • </span>(max 500MB each)
            </p>
          </div>
        </div>

        {/* Drag Active Overlay */}
        {dragState.isDragActive && (
          <div className="absolute inset-0 bg-primary-500/10 rounded-xl flex items-center justify-center">
            <div className="text-primary-600 dark:text-primary-400 font-medium">
              Drop files to upload
            </div>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="video/*,.mp4,.webm,.avi,.mov,.mkv,.wmv,.flv,.f4v,.m4v,.3gp,.ogv"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isProcessing}
        aria-hidden="true"
      />

      {/* File List */}
      {uploadedFiles.length > 0 && (
        <div className="space-y-3 sm:space-y-4">
          <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">
            Selected Files ({uploadedFiles.length})
          </h3>
          
          <div className="space-y-2 sm:space-y-3">
            {uploadedFiles.map((file) => (
              <div
                key={file.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 space-y-3 sm:space-y-0"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-start sm:items-center space-x-3">
                    {/* File Icon */}
                    <div className="flex-shrink-0 mt-0.5 sm:mt-0">
                      <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                        <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6l2 2h6a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                        </svg>
                      </div>
                    </div>
                    
                    {/* File Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                        {file.name}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                        <span>{formatFileSize(file.size)}</span>
                        {file.preview?.duration && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
                            <span>{formatDuration(file.preview.duration)}</span>
                          </>
                        )}
                        {file.preview?.dimensions && (
                          <>
                            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
                            <span>{file.preview.dimensions.width}×{file.preview.dimensions.height}</span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* Status Indicator */}
                  <div className="mt-2 sm:mt-3">
                    <div className="flex items-center space-x-2">
                      {file.status === 'pending' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                          Ready
                        </span>
                      )}
                      {file.status === 'error' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-300">
                          Error: {file.error}
                        </span>
                      )}
                      {file.status === 'converting' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-300">
                          Converting...
                        </span>
                      )}
                      {file.status === 'success' && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-300">
                          Completed
                        </span>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* Remove Button */}
                <button
                  onClick={() => handleFileRemove(file.id)}
                  className="ml-0 sm:ml-4 flex-shrink-0 p-2 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors duration-200 touch-target self-start sm:self-center"
                  aria-label={`Remove ${file.name}`}
                  disabled={file.status === 'converting'}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Environment Warning */}
      {!state.environment.crossOriginIsolated && (
        <div className="p-3 sm:p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
          <div className="flex items-start space-x-3">
            <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">
                Environment Setup Required
              </h4>
              <p className="text-xs sm:text-sm text-yellow-700 dark:text-yellow-300 mt-1 leading-relaxed">
                Video conversion requires a secure context with Cross-Origin Isolation enabled.
                Please ensure your server is properly configured.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileUpload;