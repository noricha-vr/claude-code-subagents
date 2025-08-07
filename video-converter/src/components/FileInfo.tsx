import React from 'react';
import type { VideoFile } from '@/types';
import { FileValidator } from '@/utils/fileValidator';

interface FileInfoProps {
  file: VideoFile;
  onRemove: () => void;
  onConvert: () => void;
  isConverting?: boolean;
  isConverted?: boolean;
  disabled?: boolean;
  className?: string;
}

export const FileInfo: React.FC<FileInfoProps> = ({
  file,
  onRemove,
  onConvert,
  isConverting = false,
  isConverted = false,
  disabled = false,
  className = ''
}) => {
  // Get file extension for icon
  const getFileExtension = (): string => {
    return file.name.split('.').pop()?.toLowerCase() || '';
  };

  // Get file icon based on type/extension
  const getFileIcon = () => {
    const extension = getFileExtension();
    
    // Define icon colors based on file type
    const iconColor = {
      mp4: 'text-blue-600',
      avi: 'text-purple-600',
      mov: 'text-green-600',
      mkv: 'text-indigo-600',
      webm: 'text-orange-600',
      wmv: 'text-red-600',
      flv: 'text-yellow-600',
      '3gp': 'text-pink-600',
      ogv: 'text-gray-600'
    }[extension] || 'text-gray-600';

    return (
      <div className={`w-8 h-8 ${iconColor}`}>
        <svg fill="currentColor" viewBox="0 0 24 24">
          <path d="M18,4L20,6V20A2,2 0 0,1 18,22H6A2,2 0 0,1 4,20V4A2,2 0 0,1 6,2H16L18,4M18,6H16V4H6V20H18V6M8,12V18L16,15L8,12Z" />
        </svg>
      </div>
    );
  };

  // Get status badge
  const getStatusBadge = () => {
    if (isConverted) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
          <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
          </svg>
          Converted
        </span>
      );
    }
    
    if (isConverting) {
      return (
        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          <div className="w-3 h-3 mr-1 animate-spin">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
            </svg>
          </div>
          Converting
        </span>
      );
    }
    
    return (
      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        Ready
      </span>
    );
  };

  // Format file duration if available
  const formatDuration = (seconds?: number): string => {
    if (!seconds) return '';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  };

  // Get estimated output file size (rough calculation)
  const getEstimatedOutputSize = (): string => {
    // Rough estimation: 128kbps MP3 ≈ 16KB per second
    // This is very approximate since we don't know the exact duration
    const estimatedSizeMB = (file.size / (1024 * 1024)) * 0.1; // Very rough 10% of original
    return FileValidator.formatFileSize(estimatedSizeMB * 1024 * 1024);
  };

  return (
    <div className={`${className}`}>
      <div className="flex items-start space-x-4">
        {/* File icon */}
        <div className="flex-shrink-0 pt-1">
          {getFileIcon()}
        </div>

        {/* File details */}
        <div className="flex-1 min-w-0">
          {/* File name and status */}
          <div className="flex items-center justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="text-sm font-medium text-gray-900 truncate">
                {file.name}
              </h3>
              <p className="text-xs text-gray-500 mt-1">
                {getFileExtension().toUpperCase()} • {FileValidator.formatFileSize(file.size)}
                {file.duration && ` • ${formatDuration(file.duration)}`}
              </p>
            </div>
            <div className="flex-shrink-0 ml-4">
              {getStatusBadge()}
            </div>
          </div>

          {/* Additional file information */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs text-gray-600 mb-3">
            <div>
              <span className="font-medium">Original:</span> {FileValidator.formatFileSize(file.size)}
            </div>
            <div>
              <span className="font-medium">Est. MP3:</span> {getEstimatedOutputSize()}
            </div>
            <div>
              <span className="font-medium">Quality:</span> 128kbps
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            {!isConverted && !isConverting && (
              <button
                onClick={onConvert}
                disabled={disabled}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
                </svg>
                Convert to MP3
              </button>
            )}

            {isConverted && (
              <div className="flex items-center text-xs text-green-600 font-medium">
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
                </svg>
                Ready to download
              </div>
            )}

            {isConverting && (
              <div className="flex items-center text-xs text-blue-600 font-medium">
                <div className="w-3 h-3 mr-1 animate-spin">
                  <svg fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                  </svg>
                </div>
                Converting...
              </div>
            )}

            {/* Remove button */}
            <button
              onClick={onRemove}
              disabled={isConverting}
              className="inline-flex items-center px-2 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Remove file"
            >
              <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Thumbnail preview (if available) */}
      {file.thumbnail && (
        <div className="mt-3 pl-12">
          <img
            src={file.thumbnail}
            alt={`Thumbnail for ${file.name}`}
            className="w-24 h-16 object-cover rounded-md border border-gray-200"
          />
        </div>
      )}
    </div>
  );
};