import React from 'react';
import { DownloadButtonProps } from '../types';

const DownloadButton: React.FC<DownloadButtonProps> = ({ 
  audioFile, 
  disabled = false 
}) => {
  const handleDownload = () => {
    if (!audioFile) return;
    
    const link = document.createElement('a');
    link.href = audioFile.url;
    link.download = audioFile.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!audioFile) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm font-medium text-green-800">
              {audioFile.name}
            </p>
            <p className="text-xs text-green-600">
              {formatFileSize(audioFile.size)}
            </p>
          </div>
          <div className="text-green-500">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
        </div>
        
        <button
          onClick={handleDownload}
          disabled={disabled}
          className={`w-full py-2 px-4 rounded-md font-medium transition-colors ${
            disabled
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-green-600 text-white hover:bg-green-700'
          }`}
        >
          Download MP3
        </button>
      </div>
    </div>
  );
};

export default DownloadButton;