import React, { useState } from 'react';
import type { ConversionError } from '@/types';
import { ErrorHandler } from '@/utils/errorHandler';

interface ErrorDisplayProps {
  error?: ConversionError;
  message?: string;
  title?: string;
  onDismiss?: () => void;
  onRetry?: () => void;
  showDetails?: boolean;
  className?: string;
}

export const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
  error,
  message,
  title,
  onDismiss,
  onRetry,
  showDetails = true,
  className = ''
}) => {
  const [showFullDetails, setShowFullDetails] = useState(false);

  // Get error information from props or error object
  const errorInfo = error ? ErrorHandler.formatErrorForDisplay(error) : {
    title: title || 'Error',
    message: message || 'An error occurred',
    details: undefined,
    actions: [],
    recoverable: true
  };

  // Get error icon based on severity
  const getErrorIcon = () => {
    const iconColor = error?.type === 'user_cancelled' 
      ? 'text-gray-500' 
      : error?.recoverable 
      ? 'text-yellow-500' 
      : 'text-red-500';

    return (
      <div className={`w-6 h-6 ${iconColor} flex-shrink-0`}>
        {error?.type === 'user_cancelled' ? (
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M13,14H11V10H13M13,18H11V16H13M1,21H23L12,2L1,21Z" />
          </svg>
        ) : (
          <svg fill="currentColor" viewBox="0 0 24 24">
            <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
          </svg>
        )}
      </div>
    );
  };

  // Get container styling based on error type
  const getContainerClasses = (): string => {
    const baseClasses = ['rounded-lg', 'p-4', 'border'];
    
    if (error?.type === 'user_cancelled') {
      return [...baseClasses, 'bg-gray-50', 'border-gray-200'].join(' ');
    } else if (error?.recoverable) {
      return [...baseClasses, 'bg-yellow-50', 'border-yellow-200'].join(' ');
    } else {
      return [...baseClasses, 'bg-red-50', 'border-red-200'].join(' ');
    }
  };

  const handleToggleDetails = () => {
    setShowFullDetails(!showFullDetails);
  };

  return (
    <div className={`${getContainerClasses()} ${className}`}>
      <div className="flex items-start space-x-3">
        {/* Error icon */}
        {getErrorIcon()}

        {/* Error content */}
        <div className="flex-1 min-w-0">
          {/* Title and message */}
          <div className="mb-3">
            <h3 className="text-sm font-medium text-gray-900 mb-1">
              {errorInfo.title}
            </h3>
            <p className="text-sm text-gray-700">
              {errorInfo.message}
            </p>
          </div>

          {/* Actionable advice */}
          {showDetails && errorInfo.actions.length > 0 && (
            <div className="mb-3">
              <p className="text-xs font-medium text-gray-800 mb-2">
                Try these solutions:
              </p>
              <ul className="text-xs text-gray-700 space-y-1 ml-4">
                {errorInfo.actions.map((action, index) => (
                  <li key={index} className="list-disc">
                    {action}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Technical details (collapsible) */}
          {showDetails && errorInfo.details && (
            <div className="mb-3">
              <button
                onClick={handleToggleDetails}
                className="text-xs text-gray-600 hover:text-gray-800 underline focus:outline-none"
              >
                {showFullDetails ? 'Hide technical details' : 'Show technical details'}
              </button>
              
              {showFullDetails && (
                <div className="mt-2 p-2 bg-gray-100 rounded text-xs text-gray-700 font-mono break-all">
                  {errorInfo.details}
                </div>
              )}
            </div>
          )}

          {/* Action buttons */}
          <div className="flex items-center space-x-3">
            {/* Retry button */}
            {onRetry && errorInfo.recoverable && (
              <button
                onClick={onRetry}
                className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Try Again
              </button>
            )}

            {/* Dismiss button */}
            {onDismiss && (
              <button
                onClick={onDismiss}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 transition-colors"
              >
                Dismiss
              </button>
            )}

            {/* Help/Support link */}
            <a
              href="mailto:support@example.com"
              className="text-xs text-gray-600 hover:text-gray-800 underline"
            >
              Contact Support
            </a>
          </div>
        </div>

        {/* Close button */}
        {onDismiss && (
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 focus:outline-none focus:text-gray-600 transition-colors"
            title="Close"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
};

// Toast-style error notification
interface ErrorToastProps {
  error: ConversionError;
  onDismiss: () => void;
  duration?: number;
}

export const ErrorToast: React.FC<ErrorToastProps> = ({
  error,
  onDismiss,
  duration = 5000
}) => {
  React.useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(onDismiss, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onDismiss]);

  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-white border-l-4 border-red-400 rounded-lg shadow-lg p-4">
        <div className="flex items-start space-x-3">
          <div className="w-5 h-5 text-red-500 flex-shrink-0">
            <svg fill="currentColor" viewBox="0 0 24 24">
              <path d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" />
            </svg>
          </div>
          
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">
              {ErrorHandler.formatErrorForDisplay(error).title}
            </p>
            <p className="text-xs text-gray-600 mt-1">
              {ErrorHandler.getUserFriendlyMessage(error)}
            </p>
          </div>
          
          <button
            onClick={onDismiss}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19,6.41L17.59,5L12,10.59L6.41,5L5,6.41L10.59,12L5,17.59L6.41,19L12,13.41L17.59,19L19,17.59L13.41,12L19,6.41Z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};