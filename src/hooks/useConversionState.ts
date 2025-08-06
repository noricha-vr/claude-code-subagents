import { useState, useCallback } from 'react';
import { ConversionResult, AppError } from '../types';

export interface UseConversionStateReturn {
  // State
  selectedFile: File | null;
  isConverting: boolean;
  progress: number;
  error: AppError | null;
  result: ConversionResult | null;
  
  // Actions
  setSelectedFile: (file: File | null) => void;
  setConverting: (isConverting: boolean) => void;
  setProgress: (progress: number) => void;
  setError: (error: AppError | null) => void;
  setResult: (result: ConversionResult | null) => void;
  reset: () => void;
  clearError: () => void;
}

export function useConversionState(): UseConversionStateReturn {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isConverting, setIsConverting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<AppError | null>(null);
  const [result, setResult] = useState<ConversionResult | null>(null);

  const setConverting = useCallback((converting: boolean) => {
    setIsConverting(converting);
    if (converting) {
      setError(null);
      setResult(null);
      setProgress(0);
    }
  }, []);

  const reset = useCallback(() => {
    setSelectedFile(null);
    setIsConverting(false);
    setProgress(0);
    setError(null);
    setResult(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const handleSetError = useCallback((err: AppError | null) => {
    setError(err);
    if (err) {
      setIsConverting(false);
    }
  }, []);

  const handleSetResult = useCallback((res: ConversionResult | null) => {
    setResult(res);
    if (res) {
      setIsConverting(false);
      setProgress(100);
    }
  }, []);

  return {
    // State
    selectedFile,
    isConverting,
    progress,
    error,
    result,
    
    // Actions
    setSelectedFile,
    setConverting,
    setProgress,
    setError: handleSetError,
    setResult: handleSetResult,
    reset,
    clearError
  };
}