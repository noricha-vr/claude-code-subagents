import React from 'react';
import { ErrorDisplayProps } from '../types';

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({ error, onDismiss }) => {
  if (!error) {
    return null;
  }

  const getErrorIcon = () => {
    return (
      <svg className="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    );
  };

  const getErrorTitle = () => {
    switch (error.type) {
      case 'validation':
        return 'Invalid File';
      case 'conversion':
        return 'Conversion Failed';
      case 'network':
        return 'Network Error';
      default:
        return 'Error';
    }
  };

  return (
    <div className="w-full max-w-md mx-auto mt-6" data-testid="error-display">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start">
          <div className="flex-shrink-0 mr-3">
            {getErrorIcon()}
          </div>
          <div className="flex-1">
            <h3 className="text-sm font-medium text-red-800">
              {getErrorTitle()}
            </h3>
            <p className="text-sm text-red-700 mt-1">
              {error.message}
            </p>
            {error.code && (
              <p className="text-xs text-red-600 mt-1">
                Error code: {error.code}
              </p>
            )}
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 ml-2 text-red-400 hover:text-red-600"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ErrorDisplay;