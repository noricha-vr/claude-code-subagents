import { useState, useCallback } from 'react';
import type { AppError } from '../utils/errorUtils';
import { ErrorRecovery } from '../utils/errorUtils';

export interface ErrorDisplayProps {
  /**
   * 表示するエラー
   */
  error: AppError;
  
  /**
   * 表示バリアント
   */
  variant?: 'inline' | 'card' | 'banner' | 'modal';
  
  /**
   * サイズ
   */
  size?: 'sm' | 'md' | 'lg';
  
  /**
   * 詳細表示の初期状態
   */
  showDetailsDefault?: boolean;
  
  /**
   * 復旧アクションを表示するか
   */
  showRecoveryActions?: boolean;
  
  /**
   * 閉じるボタンを表示するか
   */
  dismissible?: boolean;
  
  /**
   * エラー復旧アクションのコールバック
   */
  onRecoveryAction?: (action: string) => void;
  
  /**
   * エラー解除のコールバック
   */
  onDismiss?: () => void;
  
  /**
   * 詳細表示切り替えのコールバック
   */
  onToggleDetails?: (showDetails: boolean) => void;
  
  /**
   * カスタムクラス名
   */
  className?: string;
}

/**
 * 統一されたエラー表示コンポーネント
 */
export function ErrorDisplay({
  error,
  variant = 'card',
  size = 'md',
  showDetailsDefault = false,
  showRecoveryActions = true,
  dismissible = true,
  onRecoveryAction,
  onDismiss,
  onToggleDetails,
  className = ''
}: ErrorDisplayProps) {
  const [showDetails, setShowDetails] = useState(showDetailsDefault);
  const [isProcessingRecovery, setIsProcessingRecovery] = useState(false);

  const severity = ErrorRecovery.getSeverityLevel(error);
  const recoveryActions = ErrorRecovery.getRecoveryActions(error);

  const handleToggleDetails = useCallback(() => {
    const newShowDetails = !showDetails;
    setShowDetails(newShowDetails);
    onToggleDetails?.(newShowDetails);
  }, [showDetails, onToggleDetails]);

  const handleRecoveryAction = useCallback(async (action: string) => {
    if (!onRecoveryAction) return;
    
    setIsProcessingRecovery(true);
    try {
      await onRecoveryAction(action);
    } finally {
      setIsProcessingRecovery(false);
    }
  }, [onRecoveryAction]);

  const handleDismiss = useCallback(() => {
    onDismiss?.();
  }, [onDismiss]);

  // スタイルクラスを生成
  const containerClasses = getContainerClasses(variant, size, severity);
  const iconClasses = getIconClasses(severity);

  return (
    <div className={`${containerClasses} ${className}`}>
      {/* ヘッダー部分 */}
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3">
          {/* エラーアイコン */}
          <div className={iconClasses}>
            <ErrorIcon severity={severity} />
          </div>
          
          {/* エラー情報 */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                {getErrorTitle(error)}
              </h3>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getSeverityBadgeClasses(severity)}`}>
                {severity}
              </span>
            </div>
            
            <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
              {error.userMessage}
            </p>
            
            {/* 復旧可能性インジケーター */}
            {error.recoverable && (
              <div className="mt-2 flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <span className="text-xs text-green-600 dark:text-green-400">
                  Recoverable
                </span>
              </div>
            )}
          </div>
        </div>

        {/* 閉じるボタン */}
        {dismissible && (
          <button
            onClick={handleDismiss}
            className="ml-4 inline-flex text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 rounded-md p-1.5"
            aria-label="Dismiss error"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>

      {/* 復旧アクション */}
      {showRecoveryActions && error.recoverable && recoveryActions.length > 0 && (
        <div className="mt-4">
          <h4 className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
            Suggested Actions:
          </h4>
          <div className="flex flex-wrap gap-2">
            {recoveryActions.slice(0, 3).map((action, index) => (
              <button
                key={index}
                onClick={() => handleRecoveryAction(action)}
                disabled={isProcessingRecovery}
                className={`inline-flex items-center px-3 py-1 rounded-md text-xs font-medium transition-colors duration-200 ${
                  isProcessingRecovery
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300 dark:hover:bg-blue-900/50'
                }`}
              >
                {isProcessingRecovery && (
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-current" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {action}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 詳細情報 */}
      <div className="mt-4">
        <button
          onClick={handleToggleDetails}
          className="inline-flex items-center text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md p-1"
        >
          <span>{showDetails ? 'Hide Details' : 'Show Details'}</span>
          <svg
            className={`ml-1 w-3 h-3 transition-transform duration-200 ${showDetails ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {showDetails && (
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700">
            <dl className="space-y-2 text-xs">
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Type:</dt>
                <dd className="text-gray-600 dark:text-gray-400 font-mono">{error.type}</dd>
              </div>
              
              {error.code && (
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-300">Code:</dt>
                  <dd className="text-gray-600 dark:text-gray-400 font-mono">{error.code}</dd>
                </div>
              )}
              
              <div>
                <dt className="font-medium text-gray-700 dark:text-gray-300">Timestamp:</dt>
                <dd className="text-gray-600 dark:text-gray-400">
                  {new Date(error.timestamp).toLocaleString()}
                </dd>
              </div>
              
              {error.context && Object.keys(error.context).length > 0 && (
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-300">Context:</dt>
                  <dd className="text-gray-600 dark:text-gray-400 font-mono text-xs whitespace-pre-wrap">
                    {JSON.stringify(error.context, null, 2)}
                  </dd>
                </div>
              )}
              
              {error.originalError && (
                <div>
                  <dt className="font-medium text-gray-700 dark:text-gray-300">Original Error:</dt>
                  <dd className="text-gray-600 dark:text-gray-400 font-mono text-xs">
                    {error.originalError.message}
                  </dd>
                </div>
              )}
            </dl>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * エラーアイコンコンポーネント
 */
function ErrorIcon({ severity }: { severity: 'low' | 'medium' | 'high' | 'critical' }) {
  const iconProps = {
    className: "w-5 h-5",
    fill: "currentColor",
    viewBox: "0 0 20 20"
  };

  switch (severity) {
    case 'low':
      return (
        <svg {...iconProps}>
          <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    case 'medium':
      return (
        <svg {...iconProps}>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
        </svg>
      );
    case 'high':
    case 'critical':
    default:
      return (
        <svg {...iconProps}>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
        </svg>
      );
  }
}

/**
 * コンテナクラスを生成
 */
function getContainerClasses(
  variant: ErrorDisplayProps['variant'],
  size: ErrorDisplayProps['size'],
  severity: 'low' | 'medium' | 'high' | 'critical'
): string {
  const baseClasses = 'transition-all duration-300 ease-in-out';
  
  // バリアント別スタイル
  const variantClasses = {
    inline: 'p-3 border-l-4',
    card: 'p-4 rounded-lg border shadow-sm',
    banner: 'p-4 border-b',
    modal: 'p-6 rounded-xl shadow-lg'
  };

  // サイズ別スタイル
  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  // 重要度別カラー
  const severityClasses = {
    low: 'bg-yellow-50 border-yellow-400 dark:bg-yellow-900/20 dark:border-yellow-600',
    medium: 'bg-orange-50 border-orange-400 dark:bg-orange-900/20 dark:border-orange-600',
    high: 'bg-red-50 border-red-400 dark:bg-red-900/20 dark:border-red-600',
    critical: 'bg-red-100 border-red-500 dark:bg-red-900/30 dark:border-red-500'
  };

  return [
    baseClasses,
    variantClasses[variant!],
    sizeClasses[size!],
    severityClasses[severity]
  ].join(' ');
}

/**
 * アイコンクラスを生成
 */
function getIconClasses(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  const severityClasses = {
    low: 'text-yellow-500',
    medium: 'text-orange-500',
    high: 'text-red-500',
    critical: 'text-red-600'
  };

  return `flex-shrink-0 ${severityClasses[severity]}`;
}

/**
 * 重要度バッジクラスを生成
 */
function getSeverityBadgeClasses(severity: 'low' | 'medium' | 'high' | 'critical'): string {
  const severityClasses = {
    low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
    medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-300',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
    critical: 'bg-red-200 text-red-900 dark:bg-red-900/50 dark:text-red-200'
  };

  return severityClasses[severity];
}

/**
 * エラータイトルを生成
 */
function getErrorTitle(error: AppError): string {
  return error.type.split('_').map(word => 
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
  ).join(' ');
}

/**
 * 複数エラー表示コンポーネント
 */
export interface ErrorListProps {
  errors: AppError[];
  variant?: ErrorDisplayProps['variant'];
  size?: ErrorDisplayProps['size'];
  maxVisible?: number;
  onDismissAll?: () => void;
  onRecoveryAction?: (error: AppError, action: string) => void;
  className?: string;
}

export function ErrorList({
  errors,
  variant = 'card',
  size = 'md',
  maxVisible = 5,
  onDismissAll,
  onRecoveryAction,
  className = ''
}: ErrorListProps) {
  const [dismissedErrors, setDismissedErrors] = useState<Set<string>>(new Set());

  const visibleErrors = errors.filter(error => !dismissedErrors.has(error.timestamp));
  const displayErrors = visibleErrors.slice(0, maxVisible);
  const hiddenCount = Math.max(0, visibleErrors.length - maxVisible);

  const handleDismissError = useCallback((error: AppError) => {
    setDismissedErrors(prev => new Set(prev.add(error.timestamp)));
  }, []);

  const handleDismissAll = useCallback(() => {
    if (onDismissAll) {
      onDismissAll();
    } else {
      setDismissedErrors(new Set(errors.map(e => e.timestamp)));
    }
  }, [errors, onDismissAll]);

  if (displayErrors.length === 0) {
    return null;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {/* ヘッダー */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Errors ({visibleErrors.length})
        </h3>
        {visibleErrors.length > 0 && (
          <button
            onClick={handleDismissAll}
            className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 rounded-md px-2 py-1"
          >
            Dismiss All
          </button>
        )}
      </div>

      {/* エラーリスト */}
      <div className="space-y-3">
        {displayErrors.map((error) => (
          <ErrorDisplay
            key={error.timestamp}
            error={error}
            variant={variant}
            size={size}
            onDismiss={() => handleDismissError(error)}
            onRecoveryAction={(action) => onRecoveryAction?.(error, action)}
          />
        ))}
      </div>

      {/* 隠れたエラー数表示 */}
      {hiddenCount > 0 && (
        <div className="text-center">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {hiddenCount} more error{hiddenCount !== 1 ? 's' : ''} not shown
          </p>
        </div>
      )}
    </div>
  );
}