import React, { useRef } from 'react';
import { FileUploadProps } from '../types';
import { useFileDrop } from '../hooks/useFileDrop';

const FileUploader: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  acceptedFormats = "video/*", 
  disabled = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { isDragOver, dragProps } = useFileDrop({
    onFileSelect,
    acceptedTypes: ['video/'],
    disabled,
  });

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        {...dragProps}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          disabled 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : isDragOver
            ? 'border-green-500 bg-green-50'
            : 'border-blue-400 hover:border-blue-600 hover:bg-blue-50'
        }`}
        onClick={!disabled ? handleClick : undefined}
      >
        <div className="mb-4">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-700">
          {disabled 
            ? 'Converting...' 
            : isDragOver 
            ? 'Drop video file here' 
            : 'Click or drag & drop video file'
          }
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Supported formats: MP4, MOV, AVI, WebM
        </p>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default FileUploader;