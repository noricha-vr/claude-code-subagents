import React from 'react';
import type { ConversionProgress as ConversionProgressType } from '@/types';
import { ConversionStatus } from '@/types';
import { ProgressCalculator } from '@/utils/progressCalculator';

interface ConversionProgressProps {
  progress: ConversionProgressType;
  className?: string;
  showDetails?: boolean;
}

export const ConversionProgress: React.FC<ConversionProgressProps> = ({
  progress,
  className = '',
  showDetails = true
}) => {
  // Get progress bar color based on status and progress
  const getProgressColor = (): string => {
    switch (progress.status) {
      case ConversionStatus.COMPLETED:
        return 'bg-green-500';
      case ConversionStatus.ERROR:
        return 'bg-red-500';
      case ConversionStatus.CANCELLED:
        return 'bg-gray-500';
      case ConversionStatus.PROCESSING:
        return progress.progress < 30 
          ? 'bg-yellow-500' 
          : progress.progress < 70 
          ? 'bg-blue-500' 
          : 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  // Get status icon
  const getStatusIcon = () => {
    switch (progress.status) {
      case ConversionStatus.LOADING_FFMPEG:
        return (
          <div className="w-4 h-4 animate-spin text-blue-600">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,4V2A10,10 0 0,0 2,12H4A8,8 0 0,1 12,4Z" />
            </svg>
          </div>
        );
      
      case ConversionStatus.PROCESSING:
        return (
          <div className="w-4 h-4 animate-pulse text-blue-600">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M8,5.14V19.14L19,12.14L8,5.14Z" />
            </svg>
          </div>
        );
      
      case ConversionStatus.COMPLETED:
        return (
          <div className="w-4 h-4 text-green-600">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
            </svg>
          </div>
        );
      
      case ConversionStatus.ERROR:
        return (
          <div className="w-4 h-4 text-red-600">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
          </div>
        );
      
      case ConversionStatus.CANCELLED:
        return (
          <div className="w-4 h-4 text-gray-600">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </div>
        );
      
      default:
        return (
          <div className="w-4 h-4 text-gray-400">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4Z" />
            </svg>
          </div>
        );
    }
  };

  // Get background color for progress container
  const getContainerBgColor = (): string => {
    switch (progress.status) {
      case ConversionStatus.COMPLETED:
        return 'bg-green-50 border-green-200';
      case ConversionStatus.ERROR:
        return 'bg-red-50 border-red-200';
      case ConversionStatus.CANCELLED:
        return 'bg-gray-50 border-gray-200';
      default:
        return 'bg-blue-50 border-blue-200';
    }
  };

  // Format additional information
  const getAdditionalInfo = (): string[] => {
    const info: string[] = [];
    
    if (progress.timeRemaining) {
      info.push(`${ProgressCalculator.formatTimeRemaining(progress.timeRemaining)} remaining`);
    }
    
    if (progress.speed) {
      info.push(`${ProgressCalculator.formatSpeed(progress.speed)}`);
    }
    
    return info;
  };

  const additionalInfo = getAdditionalInfo();

  return (
    <div className={`${className}`}>
      <div className={`rounded-lg border p-4 ${getContainerBgColor()}`}>
        {/* Status header */}
        <div className="flex items-center space-x-3 mb-3">
          {getStatusIcon()}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 truncate">
              {progress.currentStep}
            </p>
            {showDetails && additionalInfo.length > 0 && (
              <p className="text-xs text-gray-600">
                {additionalInfo.join(' • ')}
              </p>
            )}
          </div>
          <div className="text-sm font-medium text-gray-700">
            {progress.progress}%
          </div>
        </div>

        {/* Progress bar */}
        <div className="relative">
          {/* Background bar */}
          <div className="w-full h-2 bg-white rounded-full overflow-hidden border">
            {/* Progress fill */}
            <div
              className={`h-full transition-all duration-300 ease-out ${getProgressColor()} ${
                progress.status === ConversionStatus.PROCESSING ? 'animate-pulse' : ''
              }`}
              style={{ width: `${Math.max(0, Math.min(100, progress.progress))}%` }}
            />
          </div>

          {/* Animated overlay for processing state */}
          {progress.status === ConversionStatus.PROCESSING && (
            <div className="absolute inset-0 rounded-full overflow-hidden">
              <div className="h-full w-full bg-gradient-to-r from-transparent via-white/30 to-transparent animate-pulse" />
            </div>
          )}
        </div>

        {/* Detailed progress info */}
        {showDetails && progress.status === ConversionStatus.PROCESSING && (
          <div className="mt-3 flex justify-between items-center text-xs text-gray-600">
            <span>Converting...</span>
            <span className="font-medium">
              {progress.progress < 100 ? `${100 - progress.progress}% remaining` : 'Finalizing...'}
            </span>
          </div>
        )}

        {/* Completion message */}
        {progress.status === ConversionStatus.COMPLETED && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-green-700">
            <div className="w-4 h-4">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M21,7L9,19L3.5,13.5L4.91,12.09L9,16.17L19.59,5.59L21,7Z" />
              </svg>
            </div>
            <span className="font-medium">Conversion completed successfully!</span>
          </div>
        )}

        {/* Error message */}
        {progress.status === ConversionStatus.ERROR && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-red-700">
            <div className="w-4 h-4">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
              </svg>
            </div>
            <span className="font-medium">Conversion failed. Please try again.</span>
          </div>
        )}

        {/* Cancelled message */}
        {progress.status === ConversionStatus.CANCELLED && (
          <div className="mt-3 flex items-center space-x-2 text-sm text-gray-700">
            <div className="w-4 h-4">
              <svg fill="currentColor" viewBox="0 0 24 24">
                <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
              </svg>
            </div>
            <span className="font-medium">Conversion was cancelled.</span>
          </div>
        )}
      </div>
    </div>
  );
};