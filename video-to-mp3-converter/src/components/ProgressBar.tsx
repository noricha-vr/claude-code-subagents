import React from 'react';

/**
 * プログレスバーの状態を定義
 */
export type ProgressBarStatus = 'pending' | 'active' | 'success' | 'error' | 'warning';

/**
 * プログレスバーのプロパティ
 */
export interface ProgressBarProps {
  /** 進捗パーセンテージ (0-100) */
  percentage: number;
  /** プログレスバーの状態 */
  status?: ProgressBarStatus;
  /** バーの高さ */
  size?: 'sm' | 'md' | 'lg';
  /** アニメーションの有効/無効 */
  animated?: boolean;
  /** ストライプ効果の有効/無効 */
  striped?: boolean;
  /** パーセンテージテキストの表示 */
  showPercentage?: boolean;
  /** カスタムラベル */
  label?: string;
  /** 追加のクラス名 */
  className?: string;
  /** テストID */
  'data-testid'?: string;
}

/**
 * ProgressBar コンポーネント
 * 
 * 変換進捗をビジュアルに表示するプログレスバーコンポーネント
 * 
 * @example
 * ```tsx
 * <ProgressBar 
 *   percentage={75} 
 *   status="active" 
 *   label="Converting video..." 
 *   animated 
 * />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  percentage,
  status = 'active',
  size = 'md',
  animated = false,
  striped = false,
  showPercentage = true,
  label,
  className = '',
  'data-testid': testId = 'progress-bar'
}) => {
  // パーセンテージを0-100の範囲に制限
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));

  // サイズに基づくスタイルクラス（レスポンシブ対応）
  const sizeClasses = {
    sm: 'h-1.5 sm:h-2',
    md: 'h-2 sm:h-3',
    lg: 'h-3 sm:h-4'
  };

  // ステータスに基づくカラークラス
  const statusClasses = {
    pending: 'bg-gray-200 dark:bg-gray-700',
    active: 'bg-gradient-to-r from-blue-500 to-blue-600',
    success: 'bg-gradient-to-r from-green-500 to-green-600',
    error: 'bg-gradient-to-r from-red-500 to-red-600',
    warning: 'bg-gradient-to-r from-yellow-500 to-yellow-600'
  };

  // 背景色クラス
  const backgroundClasses = {
    pending: 'bg-gray-100 dark:bg-gray-800',
    active: 'bg-gray-200 dark:bg-gray-700',
    success: 'bg-green-100 dark:bg-green-900/20',
    error: 'bg-red-100 dark:bg-red-900/20',
    warning: 'bg-yellow-100 dark:bg-yellow-900/20'
  };

  // アニメーションクラス
  const animationClass = animated ? 'transition-all duration-500 ease-out' : '';
  
  // ストライプ効果のクラス
  const stripeClass = striped ? 
    'bg-[length:1rem_1rem] bg-gradient-to-r from-transparent via-white/25 to-transparent' : '';

  // パルスアニメーション（進行中の場合）
  const pulseClass = status === 'active' && animated ? 'animate-pulse' : '';

  return (
    <div 
      className={`w-full ${className}`}
      data-testid={testId}
      role="progressbar"
      aria-valuenow={normalizedPercentage}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={label || `Progress ${normalizedPercentage}%`}
    >
      {/* ラベルまたはパーセンテージ表示 */}
      {(label || showPercentage) && (
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-2 gap-1 sm:gap-2">
          {label && (
            <span className="text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400 flex-shrink-0">
              {normalizedPercentage.toFixed(1)}%
            </span>
          )}
        </div>
      )}

      {/* プログレスバー本体 */}
      <div 
        className={`
          relative overflow-hidden rounded-full
          ${sizeClasses[size]}
          ${backgroundClasses[status]}
          shadow-inner
        `}
      >
        {/* プログレスバーの進行部分 */}
        <div
          className={`
            h-full rounded-full
            ${statusClasses[status]}
            ${animationClass}
            ${stripeClass}
            ${pulseClass}
            shadow-sm
          `}
          style={{
            width: `${normalizedPercentage}%`,
            transformOrigin: 'left',
          }}
          data-testid="progress-bar-fill"
        />

        {/* ストライプアニメーション（アクティブな場合） */}
        {striped && status === 'active' && (
          <div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"
            style={{
              backgroundSize: '2rem 2rem',
              animation: 'progress-stripes 1s linear infinite'
            }}
          />
        )}
      </div>

      {/* インラインCSS（ストライプアニメーション用） */}
      <style dangerouslySetInnerHTML={{
        __html: `
          @keyframes progress-stripes {
            0% {
              background-position: 2rem 0;
            }
            100% {
              background-position: 0 0;
            }
          }
        `
      }} />
    </div>
  );
};

/**
 * プログレスバーリングコンポーネント（円形）
 */
export interface ProgressRingProps {
  /** 進捗パーセンテージ (0-100) */
  percentage: number;
  /** リングのサイズ */
  size?: number;
  /** ストロークの太さ */
  strokeWidth?: number;
  /** ステータス */
  status?: ProgressBarStatus;
  /** 中央に表示するテキスト */
  children?: React.ReactNode;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * ProgressRing コンポーネント
 * 
 * 円形のプログレスリング
 */
export const ProgressRing: React.FC<ProgressRingProps> = ({
  percentage,
  size = 120,
  strokeWidth = 8,
  status = 'active',
  children,
  className = ''
}) => {
  const normalizedPercentage = Math.max(0, Math.min(100, percentage));
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (normalizedPercentage / 100) * circumference;

  // ステータスに基づくカラー
  const statusColors = {
    pending: 'stroke-gray-300 dark:stroke-gray-600',
    active: 'stroke-blue-500',
    success: 'stroke-green-500',
    error: 'stroke-red-500',
    warning: 'stroke-yellow-500'
  };

  return (
    <div 
      className={`relative inline-flex items-center justify-center ${className}`}
      style={{ width: size, height: size }}
    >
      {/* 背景リング */}
      <svg
        width={size}
        height={size}
        className="absolute inset-0 transform -rotate-90"
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          className="stroke-gray-200 dark:stroke-gray-700"
          fill="none"
        />
        {/* 進捗リング */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          strokeWidth={strokeWidth}
          fill="none"
          className={`${statusColors[status]} transition-all duration-500 ease-out`}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>

      {/* 中央のコンテンツ */}
      <div className="relative flex items-center justify-center text-center">
        {children || (
          <span className="text-sm sm:text-base lg:text-lg font-semibold text-gray-700 dark:text-gray-300">
            {normalizedPercentage.toFixed(0)}%
          </span>
        )}
      </div>
    </div>
  );
};

export default ProgressBar;