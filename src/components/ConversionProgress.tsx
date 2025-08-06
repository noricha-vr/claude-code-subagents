import React from 'react';
import { ConversionProgressProps } from '../types';

const ConversionProgress: React.FC<ConversionProgressProps> = ({ progress }) => {
  const getProgressColor = () => {
    switch (progress.stage) {
      case 'error':
        return 'bg-red-500';
      case 'complete':
        return 'bg-green-500';
      default:
        return 'bg-blue-500';
    }
  };

  const getStageMessage = () => {
    switch (progress.stage) {
      case 'loading':
        return 'Loading FFmpeg...';
      case 'converting':
        return 'Converting to MP3...';
      case 'complete':
        return 'Conversion complete!';
      case 'error':
        return 'Conversion failed';
      default:
        return progress.message;
    }
  };

  if (progress.stage === 'idle') {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto mt-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {getStageMessage()}
          </span>
          <span className="text-sm text-gray-500">
            {progress.percentage}%
          </span>
        </div>
        
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all duration-300 ${getProgressColor()}`}
            style={{ width: `${progress.percentage}%` }}
          />
        </div>
        
        {progress.timeRemaining && progress.stage === 'converting' && (
          <p className="text-xs text-gray-500 mt-2">
            Estimated time remaining: {Math.ceil(progress.timeRemaining)}s
          </p>
        )}
        
        {progress.message && (
          <p className="text-sm text-gray-600 mt-2">
            {progress.message}
          </p>
        )}
      </div>
    </div>
  );
};

export default ConversionProgress;