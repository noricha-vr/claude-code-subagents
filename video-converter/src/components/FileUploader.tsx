import React, { useCallback, useRef, useState } from 'react';
import type { DragState } from '@/types';

interface FileUploaderProps {
  onFilesSelected: (files: File[]) => void;
  onDragStateChange?: (dragState: DragState) => void;
  dragState: DragState;
  disabled?: boolean;
  maxFiles?: number;
  acceptedFormats?: string[];
  className?: string;
}

export const FileUploader: React.FC<FileUploaderProps> = ({
  onFilesSelected,
  onDragStateChange,
  dragState,
  disabled = false,
  maxFiles = 10,
  acceptedFormats = [],
  className = ''
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragCounter, setDragCounter] = useState(0);

  // Get accepted file types for input element
  const getAcceptAttribute = useCallback(() => {
    if (acceptedFormats.length === 0) return 'video/*';
    return acceptedFormats.map(format => `.${format}`).join(',') + ',video/*';
  }, [acceptedFormats]);

  // Check if files are valid for drop
  const validateFiles = useCallback((files: FileList): boolean => {
    if (files.length > maxFiles) return false;
    
    // Check file types
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.startsWith('video/')) {
        // Also check extensions if MIME type is not available
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !acceptedFormats.includes(extension)) {
          return false;
        }
      }
    }
    
    return true;
  }, [maxFiles, acceptedFormats]);

  // Handle drag events
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => prev + 1);
    
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const hasValidFiles = Array.from(e.dataTransfer.items).some(
        item => item.kind === 'file' && item.type.startsWith('video/')
      );
      
      const newDragState = {
        isDragging: true,
        isValidDrop: hasValidFiles && !disabled
      };
      
      onDragStateChange?.(newDragState);
    }
  }, [disabled, onDragStateChange]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(prev => {
      const newCounter = prev - 1;
      
      if (newCounter === 0) {
        onDragStateChange?.({
          isDragging: false,
          isValidDrop: false
        });
      }
      
      return newCounter;
    });
  }, [onDragStateChange]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    setDragCounter(0);
    onDragStateChange?.({
      isDragging: false,
      isValidDrop: false
    });

    if (disabled) return;

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      if (validateFiles(files)) {
        onFilesSelected(Array.from(files));
      }
    }
  }, [disabled, onFilesSelected, onDragStateChange, validateFiles]);

  // Handle file input change
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      onFilesSelected(Array.from(files));
    }
    
    // Reset input value to allow selecting the same file again
    if (e.target) {
      e.target.value = '';
    }
  }, [onFilesSelected]);

  // Handle click to open file dialog
  const handleClick = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);

  // Handle keyboard access
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      handleClick();
    }
  }, [disabled, handleClick]);

  // Dynamic styling based on state
  const getContainerClasses = () => {
    const baseClasses = [
      'relative',
      'glass-effect',
      'rounded-lg',
      'p-8',
      'border-2',
      'border-dashed',
      'transition-all',
      'duration-200',
      'cursor-pointer',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-primary-500',
      'focus:ring-offset-2'
    ];

    if (disabled) {
      baseClasses.push('opacity-50', 'cursor-not-allowed');
    } else if (dragState.isDragging) {
      if (dragState.isValidDrop) {
        baseClasses.push('drag-active', 'border-primary-500', 'bg-primary-50/50', 'scale-105');
      } else {
        baseClasses.push('drag-reject', 'border-red-500', 'bg-red-50/50');
      }
    } else {
      baseClasses.push(
        'border-gray-300',
        'hover:border-primary-400',
        'hover:bg-primary-50/30',
        'hover-lift'
      );
    }

    return baseClasses.join(' ');
  };

  return (
    <div className={className}>
      <div
        className={getContainerClasses()}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        onKeyDown={handleKeyDown}
        tabIndex={disabled ? -1 : 0}
        role="button"
        aria-label="Upload video files"
        aria-disabled={disabled}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={getAcceptAttribute()}
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled}
          aria-hidden="true"
        />

        {/* Upload content */}
        <div className="text-center">
          {/* Icon */}
          <div className="mx-auto mb-4">
            {dragState.isDragging ? (
              dragState.isValidDrop ? (
                <div className="w-16 h-16 mx-auto text-primary-600 animate-bounce">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M9 16h6v-6h4l-7-7-7 7h4zm-4 2h14v2H5z"/>
                  </svg>
                </div>
              ) : (
                <div className="w-16 h-16 mx-auto text-red-600">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z"/>
                  </svg>
                </div>
              )
            ) : (
              <div className="w-16 h-16 mx-auto text-gray-400">
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
            )}
          </div>

          {/* Text content */}
          <div className="space-y-2">
            {dragState.isDragging ? (
              dragState.isValidDrop ? (
                <div>
                  <p className="text-lg font-medium text-primary-700">
                    Drop your video files here!
                  </p>
                  <p className="text-sm text-primary-600">
                    Release to start uploading
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-medium text-red-700">
                    Invalid files
                  </p>
                  <p className="text-sm text-red-600">
                    Please select video files only
                  </p>
                </div>
              )
            ) : (
              <div>
                <p className="text-lg font-medium text-gray-900">
                  {disabled ? 'Converter Loading...' : 'Drop video files here'}
                </p>
                <p className="text-gray-600">
                  or <span className="text-primary-600 font-medium">click to browse</span>
                </p>
              </div>
            )}
          </div>

          {/* File format info */}
          {!disabled && (
            <div className="mt-4 text-sm text-gray-500 space-y-1">
              <p>Supported formats: {acceptedFormats.join(', ') || 'All video formats'}</p>
              <p>Maximum {maxFiles} files</p>
            </div>
          )}
        </div>

        {/* Loading overlay */}
        {disabled && (
          <div className="absolute inset-0 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
            <div className="flex items-center space-x-2 text-gray-600">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-current"></div>
              <span>Loading converter...</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};