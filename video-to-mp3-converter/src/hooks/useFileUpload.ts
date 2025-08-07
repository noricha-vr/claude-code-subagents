import { useState, useCallback } from 'react';
import type { FileUploadItem } from '../types';
import { useApp } from '../context/AppContext';
// Note: Future expansion - エラーハンドラーは将来の拡張用として準備済み
// import { useFileUploadErrorHandler } from './useErrorHandler';

interface UseFileUploadReturn {
  files: FileUploadItem[];
  isProcessing: boolean;
  addFiles: (newFiles: FileUploadItem[]) => void;
  removeFile: (fileId: string) => void;
  updateFileStatus: (fileId: string, status: FileUploadItem['status'], error?: string, convertedData?: { data: Uint8Array; filename: string }) => void;
  clearFiles: () => void;
  getFileById: (fileId: string) => FileUploadItem | undefined;
  hasValidFiles: boolean;
  pendingFiles: FileUploadItem[];
  completedFiles: FileUploadItem[];
  errorFiles: FileUploadItem[];
}

/**
 * Custom hook for managing file upload state and operations
 */
export function useFileUpload(): UseFileUploadReturn {
  const { errorHandler } = useApp();
  const [files, setFiles] = useState<FileUploadItem[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);

  // Add new files to the list
  const addFiles = useCallback((newFiles: FileUploadItem[]) => {
    setFiles(prevFiles => {
      // Remove duplicates based on file name and size
      const existingFilesMap = new Map(
        prevFiles.map(file => [`${file.name}-${file.size}`, file])
      );
      
      const uniqueNewFiles = newFiles.filter(
        newFile => !existingFilesMap.has(`${newFile.name}-${newFile.size}`)
      );
      
      if (uniqueNewFiles.length !== newFiles.length) {
        const duplicateCount = newFiles.length - uniqueNewFiles.length;
        errorHandler.actions.showWarning(
          'Duplicate Files',
          `${duplicateCount} duplicate file(s) were skipped.`
        );
      }
      
      return [...prevFiles, ...uniqueNewFiles];
    });
  }, [errorHandler.actions]);

  // Remove a file from the list
  const removeFile = useCallback((fileId: string) => {
    setFiles(prevFiles => prevFiles.filter(file => file.id !== fileId));
  }, []);

  // Update file status
  const updateFileStatus = useCallback((
    fileId: string, 
    status: FileUploadItem['status'], 
    error?: string,
    convertedData?: { data: Uint8Array; filename: string }
  ) => {
    setFiles(prevFiles =>
      prevFiles.map(file =>
        file.id === fileId
          ? { ...file, status, error, convertedData }
          : file
      )
    );
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
    setIsProcessing(false);
  }, []);

  // Get file by ID
  const getFileById = useCallback((fileId: string): FileUploadItem | undefined => {
    return files.find(file => file.id === fileId);
  }, [files]);

  // Computed values
  const hasValidFiles = files.length > 0 && files.some(file => 
    file.status === 'pending' || file.status === 'success'
  );

  const pendingFiles = files.filter(file => file.status === 'pending');
  const completedFiles = files.filter(file => file.status === 'success');
  const errorFiles = files.filter(file => file.status === 'error');

  return {
    files,
    isProcessing,
    addFiles,
    removeFile,
    updateFileStatus,
    clearFiles,
    getFileById,
    hasValidFiles,
    pendingFiles,
    completedFiles,
    errorFiles
  };
}

/**
 * Hook for handling file upload operations with automatic state management
 */
export function useFileUploadOperations() {
  const fileUpload = useFileUpload();
  const { state, actions } = useApp();

  // Handle files selected from FileUpload component
  const handleFilesSelected = useCallback((selectedFiles: FileUploadItem[]) => {
    fileUpload.addFiles(selectedFiles);
    
    if (selectedFiles.length > 0) {
      actions.clearError();
    }
  }, [fileUpload, actions]);

  // Handle file removal
  const handleFileRemove = useCallback((fileId: string) => {
    fileUpload.removeFile(fileId);
  }, [fileUpload]);

  // Start conversion process for all pending files
  const startConversion = useCallback(async () => {
    if (!state.environment.crossOriginIsolated) {
      actions.setError('Cross-Origin Isolation is required for video conversion.');
      return;
    }

    if (!fileUpload.hasValidFiles) {
      actions.setError('No valid files available for conversion.');
      return;
    }

    try {
      actions.clearError();
      
      // Update all pending files to converting status
      fileUpload.pendingFiles.forEach(file => {
        fileUpload.updateFileStatus(file.id, 'converting');
      });

      // TODO: Implement actual conversion logic in Step 7
      console.log('Starting conversion for files:', fileUpload.pendingFiles);
      
    } catch (error) {
      console.error('Conversion error:', error);
      actions.setError('Failed to start conversion process.');
      
      // Reset converting files to pending on error
      fileUpload.files
        .filter(file => file.status === 'converting')
        .forEach(file => {
          fileUpload.updateFileStatus(file.id, 'pending');
        });
    }
  }, [state.environment.crossOriginIsolated, fileUpload, actions]);

  // Check if conversion can be started
  const canStartConversion = state.environment.crossOriginIsolated && 
                            fileUpload.hasValidFiles && 
                            fileUpload.pendingFiles.length > 0;

  return {
    ...fileUpload,
    handleFilesSelected,
    handleFileRemove,
    startConversion,
    canStartConversion
  };
}