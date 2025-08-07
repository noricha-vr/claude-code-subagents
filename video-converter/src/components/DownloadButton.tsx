import React, { useCallback, useState } from 'react';
import type { ConvertedFile } from '@/types';
import { FileValidator } from '@/utils/fileValidator';

interface DownloadButtonProps {
  file: ConvertedFile;
  className?: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  showFileInfo?: boolean;
}

export const DownloadButton: React.FC<DownloadButtonProps> = ({
  file,
  className = '',
  variant = 'primary',
  size = 'md',
  showFileInfo = true
}) => {
  const [isDownloading, setIsDownloading] = useState(false);

  // Handle download action
  const handleDownload = useCallback(async () => {
    if (isDownloading) return;

    setIsDownloading(true);

    try {
      let downloadUrl = file.url;

      // Create download URL if not available
      if (!downloadUrl) {
        const blob = new Blob([file.data], { type: 'audio/mp3' });
        downloadUrl = URL.createObjectURL(blob);
      }

      // Create temporary link for download
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = file.name;
      link.style.display = 'none';
      
      // Add to DOM and trigger click
      document.body.appendChild(link);
      link.click();
      
      // Clean up
      document.body.removeChild(link);
      
      // Clean up URL if we created it
      if (!file.url && downloadUrl) {
        // Clean up after a delay to ensure download started
        setTimeout(() => {
          URL.revokeObjectURL(downloadUrl);
        }, 1000);
      }

      // Track download event (if analytics available)
      if (typeof window !== 'undefined' && (window as any).gtag) {
        (window as any).gtag('event', 'file_download', {
          file_size: file.size,
          file_type: 'mp3'
        });
      }

    } catch (error) {
      console.error('Download failed:', error);
      
      // Show error message
      if (typeof window !== 'undefined') {
        alert('Download failed. Please try again.');
      }
    } finally {
      setIsDownloading(false);
    }
  }, [file, isDownloading]);

  // Handle share action (Web Share API if available)
  const handleShare = useCallback(async () => {
    if (!navigator.share || !file.url) return;

    try {
      await navigator.share({
        title: `${file.name}`,
        text: 'Converted MP3 audio file',
        url: file.url
      });
    } catch (error) {
      // User cancelled or share failed
      console.log('Share cancelled or failed:', error);
    }
  }, [file]);

  // Get button styling classes
  const getButtonClasses = (): string => {
    const baseClasses = [
      'inline-flex',
      'items-center',
      'justify-center',
      'border',
      'font-medium',
      'rounded-lg',
      'focus:outline-none',
      'focus:ring-2',
      'focus:ring-offset-2',
      'transition-all',
      'duration-200',
      'disabled:opacity-50',
      'disabled:cursor-not-allowed'
    ];

    // Size variants
    const sizeClasses = {
      sm: ['px-3', 'py-1.5', 'text-xs'],
      md: ['px-4', 'py-2', 'text-sm'],
      lg: ['px-6', 'py-3', 'text-base']
    }[size];

    // Color variants
    const variantClasses = {
      primary: [
        'text-white',
        'bg-green-600',
        'border-transparent',
        'hover:bg-green-700',
        'focus:ring-green-500',
        'shadow-sm',
        'hover:shadow-md'
      ],
      secondary: [
        'text-green-700',
        'bg-green-50',
        'border-green-200',
        'hover:bg-green-100',
        'focus:ring-green-500'
      ]
    }[variant];

    return [...baseClasses, ...sizeClasses, ...variantClasses].join(' ');
  };

  return (
    <div className={className}>
      {/* File info section */}
      {showFileInfo && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              {/* MP3 icon */}
              <div className="w-6 h-6 text-green-600">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                </svg>
              </div>
              
              {/* File details */}
              <div>
                <p className="text-sm font-medium text-green-900 truncate">
                  {file.name}
                </p>
                <p className="text-xs text-green-700">
                  {FileValidator.formatFileSize(file.size)} • MP3 (128kbps)
                </p>
              </div>
            </div>

            {/* Success checkmark */}
            <div className="w-6 h-6 text-green-600">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Download actions */}
      <div className="flex items-center space-x-3">
        {/* Main download button */}
        <button
          onClick={handleDownload}
          disabled={isDownloading}
          className={getButtonClasses()}
          title={`Download ${file.name}`}
        >
          {isDownloading ? (
            <>
              <div className="w-4 h-4 mr-2 animate-spin">
                <svg fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
                </svg>
              </div>
              Downloading...
            </>
          ) : (
            <>
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Download MP3
            </>
          )}
        </button>

        {/* Share button (if Web Share API is supported) */}
        {navigator.share && file.url && (
          <button
            onClick={handleShare}
            className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
            title="Share file"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
            </svg>
          </button>
        )}

        {/* Copy URL button (if URL is available) */}
        {file.url && (
          <CopyURLButton url={file.url} />
        )}
      </div>
    </div>
  );
};

// Copy URL component
interface CopyURLButtonProps {
  url: string;
}

const CopyURLButton: React.FC<CopyURLButtonProps> = ({ url }) => {
  const [copied, setCopied] = useState(false);

  const handleCopyURL = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      
      // Reset copied state after 2 seconds
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
    }
  }, [url]);

  return (
    <button
      onClick={handleCopyURL}
      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
      title="Copy download URL"
    >
      {copied ? (
        <>
          <svg className="w-4 h-4 text-green-600" fill="currentColor" viewBox="0 0 24 24">
            <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
          </svg>
        </>
      ) : (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
        </svg>
      )}
    </button>
  );
};