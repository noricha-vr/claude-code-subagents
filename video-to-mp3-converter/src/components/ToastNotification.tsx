import { useEffect, useState, useCallback } from 'react';
import type { ToastNotification } from '../hooks/useGlobalErrorHandler';

export interface ToastContainerProps {
  /**
   * 表示中のトースト通知リスト
   */
  notifications: ToastNotification[];
  
  /**
   * 通知削除のコールバック
   */
  onRemove: (id: string) => void;
  
  /**
   * 表示位置
   */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  
  /**
   * 最大表示数
   */
  maxToasts?: number;
  
  /**
   * カスタムクラス名
   */
  className?: string;
}

/**
 * トースト通知コンテナ
 */
export function ToastContainer({
  notifications,
  onRemove,
  position = 'top-right',
  maxToasts = 5,
  className = ''
}: ToastContainerProps) {
  // 最新の通知を優先表示
  const displayNotifications = notifications.slice(-maxToasts);

  const positionClasses = getPositionClasses(position);

  return (
    <div
      className={`fixed z-50 pointer-events-none ${positionClasses} ${className}`}
      aria-live="polite"
      aria-label="Notifications"
    >
      <div className="flex flex-col space-y-3">
        {displayNotifications.map((notification) => (
          <ToastItem
            key={notification.id}
            notification={notification}
            onRemove={onRemove}
            position={position}
          />
        ))}
      </div>
    </div>
  );
}

interface ToastItemProps {
  notification: ToastNotification;
  onRemove: (id: string) => void;
  position: ToastContainerProps['position'];
}

/**
 * 個別トースト通知アイテム
 */
function ToastItem({ notification, onRemove, position }: ToastItemProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isExiting, setIsExiting] = useState(false);

  // エントランスアニメーション
  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  // 自動削除タイマー
  useEffect(() => {
    if (!notification.duration || notification.duration <= 0) return;

    const timer = setTimeout(() => {
      handleRemove();
    }, notification.duration);

    return () => clearTimeout(timer);
  }, [notification.duration, notification.id]);

  const handleRemove = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onRemove(notification.id);
    }, 300); // アニメーション時間
  }, [notification.id, onRemove]);

  const handleActionClick = useCallback(() => {
    if (notification.action) {
      notification.action.onClick();
      handleRemove();
    }
  }, [notification.action, handleRemove]);

  const containerClasses = getToastClasses(notification.type, isVisible, isExiting, position);
  const iconClasses = getIconClasses(notification.type);

  return (
    <div
      className={`${containerClasses} pointer-events-auto`}
      role="alert"
      aria-live="assertive"
    >
      <div className="flex">
        {/* アイコン */}
        <div className={`flex-shrink-0 ${iconClasses}`}>
          <ToastIcon type={notification.type} />
        </div>

        {/* コンテンツ */}
        <div className="ml-3 w-0 flex-1">
          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
            {notification.title}
          </div>
          <div className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {notification.message}
          </div>
          
          {/* アクションボタン */}
          {notification.action && (
            <div className="mt-3">
              <button
                onClick={handleActionClick}
                className="bg-white dark:bg-gray-800 rounded-md text-sm font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                {notification.action.label}
              </button>
            </div>
          )}
        </div>

        {/* 閉じるボタン */}
        <div className="ml-4 flex-shrink-0 flex">
          <button
            onClick={handleRemove}
            className="bg-white dark:bg-gray-800 rounded-md inline-flex text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            aria-label="Close notification"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>
      </div>

      {/* プログレスバー（持続時間がある場合） */}
      {notification.duration && notification.duration > 0 && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200 dark:bg-gray-700">
          <div
            className={`h-full ${getProgressBarClasses(notification.type)} transition-all ease-linear`}
            style={{
              animation: `shrink ${notification.duration}ms linear forwards`
            }}
          />
        </div>
      )}
    </div>
  );
}

/**
 * トーストアイコンコンポーネント
 */
function ToastIcon({ type }: { type: ToastNotification['type'] }) {
  const iconProps = {
    className: "h-5 w-5",
    fill: "currentColor",
    viewBox: "0 0 20 20"
  };

  switch (type) {
    case 'success':
      return (
        <svg {...iconProps}>
          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.236 4.53L7.73 10.57a.75.75 0 00-1.08 1.04l2.147 2.226a.75.75 0 001.167-.058l3.857-5.386z" clipRule="evenodd" />
        </svg>
      );
    case 'error':
      return (
        <svg {...iconProps}>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    case 'warning':
      return (
        <svg {...iconProps}>
          <path fillRule="evenodd" d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 0110 5zm0 9a1 1 0 100-2 1 1 0 000 2z" clipRule="evenodd" />
        </svg>
      );
    case 'info':
    default:
      return (
        <svg {...iconProps}>
          <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
        </svg>
      );
  }
}

/**
 * 位置クラスを生成
 */
function getPositionClasses(position: ToastContainerProps['position']): string {
  switch (position) {
    case 'top-left':
      return 'top-4 left-4';
    case 'top-center':
      return 'top-4 left-1/2 transform -translate-x-1/2';
    case 'top-right':
      return 'top-4 right-4';
    case 'bottom-left':
      return 'bottom-4 left-4';
    case 'bottom-center':
      return 'bottom-4 left-1/2 transform -translate-x-1/2';
    case 'bottom-right':
      return 'bottom-4 right-4';
    default:
      return 'top-4 right-4';
  }
}

/**
 * トーストクラスを生成
 */
function getToastClasses(
  type: ToastNotification['type'],
  isVisible: boolean,
  isExiting: boolean,
  position?: ToastContainerProps['position']
): string {
  const baseClasses = 'relative max-w-sm w-full bg-white dark:bg-gray-800 shadow-lg rounded-lg pointer-events-auto ring-1 ring-black ring-opacity-5 overflow-hidden transition-all duration-300 ease-out';
  
  // タイプ別ボーダークラス
  const typeClasses = {
    success: 'border-l-4 border-green-400',
    error: 'border-l-4 border-red-400',
    warning: 'border-l-4 border-yellow-400',
    info: 'border-l-4 border-blue-400'
  };

  // アニメーションクラス
  let animationClasses = '';
  if (isExiting) {
    animationClasses = 'transform scale-95 opacity-0';
  } else if (isVisible) {
    animationClasses = 'transform scale-100 opacity-100';
  } else {
    // 初期状態 - 位置に応じてエントランスアニメーション方向を決定
    const isRight = position?.includes('right');
    const isLeft = position?.includes('left');
    const isTop = position?.includes('top');
    const isBottom = position?.includes('bottom');
    
    if (isRight) {
      animationClasses = 'transform translate-x-full opacity-0';
    } else if (isLeft) {
      animationClasses = 'transform -translate-x-full opacity-0';
    } else if (isTop) {
      animationClasses = 'transform -translate-y-full opacity-0';
    } else if (isBottom) {
      animationClasses = 'transform translate-y-full opacity-0';
    } else {
      animationClasses = 'transform scale-95 opacity-0';
    }
  }

  return [
    baseClasses,
    typeClasses[type],
    animationClasses,
    'p-4'
  ].join(' ');
}

/**
 * アイコンクラスを生成
 */
function getIconClasses(type: ToastNotification['type']): string {
  const typeClasses = {
    success: 'text-green-400',
    error: 'text-red-400',
    warning: 'text-yellow-400',
    info: 'text-blue-400'
  };

  return typeClasses[type];
}

/**
 * プログレスバークラスを生成
 */
function getProgressBarClasses(type: ToastNotification['type']): string {
  const typeClasses = {
    success: 'bg-green-400',
    error: 'bg-red-400',
    warning: 'bg-yellow-400',
    info: 'bg-blue-400'
  };

  return typeClasses[type];
}

// CSSアニメーション（グローバルスタイルに追加する必要があります）
const toastStyles = `
@keyframes shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
`;

// スタイル注入（実際の実装では別ファイルかCSSで定義）
if (typeof document !== 'undefined') {
  const styleSheet = document.createElement('style');
  styleSheet.textContent = toastStyles;
  document.head.appendChild(styleSheet);
}