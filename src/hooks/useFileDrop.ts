import { useCallback, useState } from 'react';

interface UseFileDropOptions {
  onFileSelect: (file: File) => void;
  acceptedTypes?: string[];
  disabled?: boolean;
}

interface UseFileDropResult {
  isDragOver: boolean;
  dragProps: {
    onDragOver: (e: React.DragEvent) => void;
    onDragLeave: (e: React.DragEvent) => void;
    onDrop: (e: React.DragEvent) => void;
  };
}

export const useFileDrop = ({ 
  onFileSelect, 
  acceptedTypes = ['video/'], 
  disabled = false 
}: UseFileDropOptions): UseFileDropResult => {
  const [isDragOver, setIsDragOver] = useState(false);

  const validateFile = useCallback((file: File): boolean => {
    return acceptedTypes.some(type => 
      file.type.startsWith(type) || file.type.includes(type)
    );
  }, [acceptedTypes]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) {
      setIsDragOver(true);
    }
  }, [disabled]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    
    if (disabled) return;

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      if (validateFile(file)) {
        onFileSelect(file);
      }
    }
  }, [disabled, onFileSelect, validateFile]);

  return {
    isDragOver,
    dragProps: {
      onDragOver: handleDragOver,
      onDragLeave: handleDragLeave,
      onDrop: handleDrop,
    },
  };
};