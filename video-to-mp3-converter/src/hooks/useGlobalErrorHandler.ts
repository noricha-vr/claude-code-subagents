import { useCallback, useEffect, useRef, useState } from 'react';
import { AppError, globalErrorAnalyzer } from '../utils/errorUtils';
import type { AppErrorType } from '../utils/errorUtils';
import { useErrorHandler } from './useErrorHandler';

export interface ToastNotification {
  id: string;
  type: 'error' | 'warning' | 'info' | 'success';
  title: string;
  message: string;
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
  timestamp: string;
}

export interface GlobalErrorState {
  /**
   * 現在表示中のトースト通知
   */
  notifications: ToastNotification[];
  
  /**
   * 最後に発生したエラー
   */
  lastError: AppError | null;
  
  /**
   * エラー発生回数
   */
  errorCount: number;
  
  /**
   * システム状態（正常/警告/エラー）
   */
  systemStatus: 'healthy' | 'warning' | 'error' | 'critical';
}

export interface GlobalErrorActions {
  /**
   * エラーを処理し、適切な通知を表示
   */
  reportError: (error: unknown, context?: string) => AppError;
  
  /**
   * 成功通知を表示
   */
  showSuccess: (title: string, message: string) => void;
  
  /**
   * 警告通知を表示
   */
  showWarning: (title: string, message: string) => void;
  
  /**
   * 情報通知を表示
   */
  showInfo: (title: string, message: string) => void;
  
  /**
   * 通知を削除
   */
  removeNotification: (id: string) => void;
  
  /**
   * 全通知をクリア
   */
  clearAllNotifications: () => void;
  
  /**
   * エラー統計をリセット
   */
  resetErrorStats: () => void;
  
  /**
   * システム状態を強制更新
   */
  updateSystemStatus: () => void;
  
  /**
   * エラー詳細を取得
   */
  getErrorDetails: () => {
    recentErrors: AppError[];
    errorsByType: Record<AppErrorType, number>;
    systemHealth: number; // 0-100の健康度スコア
  };
}

/**
 * グローバルエラーハンドリングのためのカスタムフック
 */
export function useGlobalErrorHandler(): {
  state: GlobalErrorState;
  actions: GlobalErrorActions;
} {
  const [notifications, setNotifications] = useState<ToastNotification[]>([]);
  const [lastError, setLastError] = useState<AppError | null>(null);
  const [errorCount, setErrorCount] = useState<number>(0);
  const [systemStatus, setSystemStatus] = useState<GlobalErrorState['systemStatus']>('healthy');

  const notificationIdCounter = useRef<number>(0);
  const errorHandler = useErrorHandler({
    context: 'GlobalErrorHandler',
    enableNotification: false, // 自分で通知を制御
    enableLogging: true
  });

  /**
   * システム状態を計算
   */
  const calculateSystemStatus = useCallback((): GlobalErrorState['systemStatus'] => {
    const stats = globalErrorAnalyzer.getStats();
    const recentErrors = stats.recentErrors;
    
    if (recentErrors.length === 0) {
      return 'healthy';
    }

    const criticalErrors = recentErrors.filter(e => 
      ['ENVIRONMENT_ERROR', 'MEMORY_ERROR', 'UNKNOWN_ERROR'].includes(e.type)
    );
    
    const nonRecoverableErrors = recentErrors.filter(e => !e.recoverable);
    
    if (criticalErrors.length > 0 || nonRecoverableErrors.length > 2) {
      return 'critical';
    }
    
    if (recentErrors.length > 3 || nonRecoverableErrors.length > 0) {
      return 'error';
    }
    
    if (recentErrors.length > 1) {
      return 'warning';
    }

    return 'healthy';
  }, []);

  /**
   * 通知を追加
   */
  const addNotification = useCallback((notification: Omit<ToastNotification, 'id' | 'timestamp'>) => {
    const id = `notification-${++notificationIdCounter.current}`;
    const newNotification: ToastNotification = {
      ...notification,
      id,
      timestamp: new Date().toISOString(),
      duration: notification.duration ?? (notification.type === 'error' ? 8000 : 5000)
    };

    setNotifications(prev => [...prev, newNotification]);

    // 自動削除タイマーを設定
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, newNotification.duration);
    }

    return id;
  }, []);

  /**
   * エラーを報告し、適切な通知を表示
   */
  const reportError = useCallback((error: unknown, context = 'Unknown'): AppError => {
    const handledError = errorHandler.handleError(error, { globalContext: context });
    
    setLastError(handledError);
    setErrorCount(prev => prev + 1);

    // エラータイプに基づいて通知を作成
    const notificationTitle = getErrorNotificationTitle(handledError.type);
    const actionButton = handledError.recoverable ? {
      label: 'Retry',
      onClick: () => {
        errorHandler.attemptRecovery(handledError);
      }
    } : undefined;

    addNotification({
      type: 'error',
      title: notificationTitle,
      message: handledError.userMessage,
      action: actionButton,
      duration: handledError.recoverable ? 10000 : 8000
    });

    // システム状態を更新
    const newSystemStatus = calculateSystemStatus();
    setSystemStatus(newSystemStatus);

    return handledError;
  }, [errorHandler, addNotification, calculateSystemStatus]);

  /**
   * 成功通知を表示
   */
  const showSuccess = useCallback((title: string, message: string) => {
    addNotification({
      type: 'success',
      title,
      message,
      duration: 4000
    });
  }, [addNotification]);

  /**
   * 警告通知を表示
   */
  const showWarning = useCallback((title: string, message: string) => {
    addNotification({
      type: 'warning',
      title,
      message,
      duration: 6000
    });
  }, [addNotification]);

  /**
   * 情報通知を表示
   */
  const showInfo = useCallback((title: string, message: string) => {
    addNotification({
      type: 'info',
      title,
      message,
      duration: 5000
    });
  }, [addNotification]);

  /**
   * 通知を削除
   */
  const removeNotification = useCallback((id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * 全通知をクリア
   */
  const clearAllNotifications = useCallback(() => {
    setNotifications([]);
  }, []);

  /**
   * エラー統計をリセット
   */
  const resetErrorStats = useCallback(() => {
    setErrorCount(0);
    setLastError(null);
    globalErrorAnalyzer.clearErrors();
    setSystemStatus('healthy');
  }, []);

  /**
   * システム状態を強制更新
   */
  const updateSystemStatus = useCallback(() => {
    const newStatus = calculateSystemStatus();
    setSystemStatus(newStatus);
  }, [calculateSystemStatus]);

  /**
   * エラー詳細を取得
   */
  const getErrorDetails = useCallback(() => {
    const stats = globalErrorAnalyzer.getStats();
    
    // システム健康度スコアを計算（0-100）
    const totalErrors = stats.totalErrors;
    const recoverableErrors = stats.recoverableErrors;
    const nonRecoverableErrors = stats.nonRecoverableErrors;
    
    let healthScore = 100;
    if (totalErrors > 0) {
      healthScore = Math.max(0, 100 - (nonRecoverableErrors * 20) - (recoverableErrors * 5));
    }

    return {
      recentErrors: stats.recentErrors,
      errorsByType: stats.errorsByType,
      systemHealth: healthScore
    };
  }, []);

  // グローバルエラーイベントリスナー
  useEffect(() => {
    const handleUnhandledError = (event: ErrorEvent) => {
      reportError(event.error, 'UnhandledError');
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      reportError(event.reason, 'UnhandledPromiseRejection');
    };

    window.addEventListener('error', handleUnhandledError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('error', handleUnhandledError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, [reportError]);

  // システム状態を定期的にチェック
  useEffect(() => {
    const interval = setInterval(() => {
      updateSystemStatus();
    }, 30000); // 30秒ごと

    return () => clearInterval(interval);
  }, [updateSystemStatus]);

  return {
    state: {
      notifications,
      lastError,
      errorCount,
      systemStatus
    },
    actions: {
      reportError,
      showSuccess,
      showWarning,
      showInfo,
      removeNotification,
      clearAllNotifications,
      resetErrorStats,
      updateSystemStatus,
      getErrorDetails
    }
  };
}

/**
 * エラータイプから通知タイトルを生成
 */
function getErrorNotificationTitle(errorType: AppErrorType): string {
  switch (errorType) {
    case 'VALIDATION_ERROR':
      return 'Validation Error';
    case 'CONVERSION_ERROR':
      return 'Conversion Failed';
    case 'DOWNLOAD_ERROR':
      return 'Download Failed';
    case 'NETWORK_ERROR':
      return 'Network Error';
    case 'WORKER_ERROR':
      return 'Processing Error';
    case 'ENVIRONMENT_ERROR':
      return 'Browser Compatibility Issue';
    case 'FILE_SYSTEM_ERROR':
      return 'File System Error';
    case 'MEMORY_ERROR':
      return 'Memory Error';
    case 'TIMEOUT_ERROR':
      return 'Operation Timed Out';
    case 'USER_ABORT_ERROR':
      return 'Operation Cancelled';
    case 'UNKNOWN_ERROR':
    default:
      return 'Unexpected Error';
  }
}

/**
 * エラー詳細表示用のフック
 */
export function useErrorDetails() {
  const [showDetails, setShowDetails] = useState(false);

  const toggleDetails = useCallback(() => {
    setShowDetails(prev => !prev);
  }, []);

  const formatErrorForDisplay = useCallback((error: AppError) => {
    return {
      type: error.type,
      message: error.message,
      userMessage: error.userMessage,
      timestamp: new Date(error.timestamp).toLocaleString(),
      recoverable: error.recoverable,
      context: error.context
    };
  }, []);

  return {
    showDetails,
    toggleDetails,
    formatErrorForDisplay
  };
}