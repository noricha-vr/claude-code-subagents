import React, { useMemo } from 'react';
import { ProgressBar, ProgressRing } from './ProgressBar';
import type { ProgressBarStatus } from './ProgressBar';
import type { 
  BatchProgress, 
  ConversionProgress as ConversionProgressType, 
  ConversionResult
} from '../types/index';

/**
 * ConversionProgressのプロパティ
 */
export interface ConversionProgressProps {
  /** バッチ進捗データ */
  batchProgress?: BatchProgress | null;
  /** 現在変換中のファイル名 */
  currentFile?: string | null;
  /** 変換結果 */
  results?: ConversionResult[];
  /** 変換中かどうか */
  isConverting?: boolean;
  /** キャンセル可能かどうか */
  canCancel?: boolean;
  /** キャンセル処理を実行中かどうか */
  isCancelling?: boolean;
  /** キャンセルハンドラー */
  onCancel?: () => void;
  /** スタイル設定 */
  variant?: 'detailed' | 'compact' | 'minimal';
  /** 表示設定 */
  showFileDetails?: boolean;
  showOverallProgress?: boolean;
  showStats?: boolean;
  /** アニメーション設定 */
  animated?: boolean;
  /** レスポンシブモード */
  responsive?: boolean;
  /** 追加のクラス名 */
  className?: string;
}

/**
 * 時間をフォーマットする関数
 */
const formatTime = (seconds: number | null): string => {
  if (seconds === null || !isFinite(seconds) || seconds < 0) {
    return '--:--';
  }
  
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
};

/**
 * ファイルサイズをフォーマットする関数
 */
const formatFileSize = (bytes: number): string => {
  const sizes = ['B', 'KB', 'MB', 'GB'];
  if (bytes === 0) return '0 B';
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`;
};

/**
 * 変換速度を計算する関数
 */
const calculateSpeed = (processedTime: string | null, elapsedTime: number): string => {
  if (!processedTime || elapsedTime <= 0) return '--x';
  
  // processedTimeを秒に変換（例: "00:01:30" -> 90秒）
  const timeParts = processedTime.split(':').map(Number);
  let totalSeconds = 0;
  
  if (timeParts.length === 3) { // HH:MM:SS
    totalSeconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
  } else if (timeParts.length === 2) { // MM:SS
    totalSeconds = timeParts[0] * 60 + timeParts[1];
  }
  
  const speed = totalSeconds / elapsedTime;
  return `${speed.toFixed(1)}x`;
};

/**
 * 進捗状態からProgressBarStatusを取得
 */
const getProgressStatus = (stage: ConversionProgressType['stage']): ProgressBarStatus => {
  switch (stage) {
    case 'initializing': return 'pending';
    case 'processing': return 'active';
    case 'completed': return 'success';
    case 'error': return 'error';
    default: return 'pending';
  }
};

/**
 * ファイル個別進捗コンポーネント
 */
const FileProgressItem: React.FC<{
  progress: ConversionProgressType;
  showDetails?: boolean;
  animated?: boolean;
}> = ({ progress, showDetails = true, animated = true }) => {
  const status = getProgressStatus(progress.stage);
  const elapsedTime = Date.now() / 1000; // 簡略化（実際は開始時間からの計算が必要）
  
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4 shadow-sm">
      <div className="flex items-start sm:items-center justify-between mb-2 sm:mb-3 gap-2">
        <span className="text-xs sm:text-sm font-medium text-gray-900 dark:text-gray-100 truncate flex-1">
          {progress.fileId}
        </span>
        <span className={`
          text-xs px-2 py-1 rounded-full font-medium flex-shrink-0
          ${status === 'pending' ? 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' : ''}
          ${status === 'active' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-300' : ''}
          ${status === 'success' ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-300' : ''}
          ${status === 'error' ? 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-300' : ''}
        `}>
          {progress.stage}
        </span>
      </div>
      
      <ProgressBar
        percentage={progress.percentage}
        status={status}
        size="sm"
        animated={animated}
        striped={status === 'active'}
        showPercentage={true}
      />
      
      {showDetails && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div>
            <span className="font-medium">Time Remaining:</span>
            <span className="ml-2 sm:block sm:ml-0 text-gray-500 dark:text-gray-500">
              {formatTime(progress.timeRemaining)}
            </span>
          </div>
          <div>
            <span className="font-medium">Speed:</span>
            <span className="ml-2 sm:block sm:ml-0 text-gray-500 dark:text-gray-500">
              {progress.speed || calculateSpeed(progress.processedTime, elapsedTime)}
            </span>
          </div>
        </div>
      )}
      
      {progress.error && (
        <div className="mt-2 p-2 bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          {progress.error}
        </div>
      )}
    </div>
  );
};

/**
 * ConversionProgress コンポーネント
 * 
 * 動画変換の進捗状況を表示するメインコンポーネント
 * ファイル毎の進捗、全体進捗、統計情報を包括的に表示
 */
export const ConversionProgress: React.FC<ConversionProgressProps> = ({
  batchProgress,
  currentFile,
  results = [],
  isConverting = false,
  canCancel = false,
  isCancelling = false,
  onCancel,
  variant = 'detailed',
  showFileDetails = true,
  showOverallProgress = true,
  showStats = true,
  animated = true,
  responsive = true,
  className = ''
}) => {
  // 統計情報の計算
  const stats = useMemo(() => {
    if (!batchProgress) return null;
    
    const totalSize = results.reduce((sum, result) => 
      sum + (result.originalFile?.size || 0), 0
    );
    
    const averageTime = batchProgress.completedFiles > 0 
      ? results.reduce((sum, result) => sum + result.processingTime, 0) / batchProgress.completedFiles
      : 0;
    
    const successRate = batchProgress.totalFiles > 0
      ? ((batchProgress.completedFiles - batchProgress.failedFiles) / batchProgress.totalFiles) * 100
      : 0;
    
    return {
      totalSize,
      averageTime,
      successRate
    };
  }, [batchProgress, results]);

  // 全体進捗のステータス決定
  const overallStatus: ProgressBarStatus = useMemo(() => {
    if (!batchProgress) return 'pending';
    if (batchProgress.hasErrors) return 'error';
    if (batchProgress.isComplete) return 'success';
    if (isConverting) return 'active';
    return 'pending';
  }, [batchProgress, isConverting]);

  if (!batchProgress && !isConverting) {
    return (
      <div className={`text-center py-8 ${className}`}>
        <div className="text-gray-500 dark:text-gray-400">
          No conversion in progress
        </div>
      </div>
    );
  }

  // Minimal variant
  if (variant === 'minimal') {
    return (
      <div className={`space-y-2 sm:space-y-3 ${className}`}>
        {showOverallProgress && batchProgress && (
          <ProgressBar
            percentage={batchProgress.overallPercentage}
            status={overallStatus}
            size="sm"
            animated={animated}
            label={currentFile ? `Converting: ${currentFile}` : 'Converting...'}
            showPercentage={true}
          />
        )}
        {canCancel && (
          <div className="flex justify-end">
            <button
              onClick={onCancel}
              disabled={isCancelling}
              className="px-3 py-2 text-xs sm:text-sm bg-red-100 hover:bg-red-200 text-red-700 dark:bg-red-900/20 dark:hover:bg-red-900/30 dark:text-red-300 rounded disabled:opacity-50 disabled:cursor-not-allowed transition-colors touch-target"
            >
              {isCancelling ? 'Cancelling...' : 'Cancel'}
            </button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`space-y-4 sm:space-y-6 ${className}`}>
      {/* 全体進捗セクション */}
      {showOverallProgress && batchProgress && (
        <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 sm:p-4 lg:p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4 sm:mb-6 gap-3 sm:gap-0">
            <h3 className="text-base sm:text-lg lg:text-xl font-semibold text-gray-900 dark:text-gray-100">
              Overall Progress
            </h3>
            {canCancel && (
              <button
                onClick={onCancel}
                disabled={isCancelling}
                className="px-3 sm:px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2 text-sm sm:text-base touch-target"
              >
                {isCancelling ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Cancelling...</span>
                  </>
                ) : (
                  <span>Cancel Conversion</span>
                )}
              </button>
            )}
          </div>

          {/* 円形プログレス（大きなスクリーン）とバープログレス（小さなスクリーン） */}
          <div className={`${responsive ? 'flex flex-col lg:flex-row items-center' : 'flex items-center'} space-y-4 lg:space-y-0 lg:space-x-6`}>
            {/* 円形プログレス */}
            <div className={`${responsive ? 'lg:block hidden' : 'block'}`}>
              <ProgressRing
                percentage={batchProgress.overallPercentage}
                status={overallStatus}
                size={120}
                strokeWidth={8}
              >
                <div className="text-center">
                  <div className="text-lg sm:text-xl font-bold text-gray-900 dark:text-gray-100">
                    {batchProgress.overallPercentage.toFixed(0)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    {batchProgress.completedFiles}/{batchProgress.totalFiles}
                  </div>
                </div>
              </ProgressRing>
            </div>

            {/* プログレスバー（モバイル用） */}
            <div className={`${responsive ? 'lg:hidden block w-full' : 'hidden'}`}>
              <ProgressBar
                percentage={batchProgress.overallPercentage}
                status={overallStatus}
                size="lg"
                animated={animated}
                striped={overallStatus === 'active'}
                label={`${batchProgress.completedFiles}/${batchProgress.totalFiles} files completed`}
                showPercentage={true}
              />
            </div>

            {/* 統計情報 */}
            <div className="flex-1 space-y-3 sm:space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-sm">
                <div className="text-center sm:text-left">
                  <span className="font-medium text-gray-700 dark:text-gray-300 block sm:inline">Completed:</span>
                  <div className="text-green-600 dark:text-green-400 font-semibold">
                    {batchProgress.completedFiles - batchProgress.failedFiles} files
                  </div>
                </div>
                <div className="text-center sm:text-left">
                  <span className="font-medium text-gray-700 dark:text-gray-300 block sm:inline">Failed:</span>
                  <div className="text-red-600 dark:text-red-400 font-semibold">
                    {batchProgress.failedFiles} files
                  </div>
                </div>
                <div className="text-center sm:text-left sm:col-span-2 lg:col-span-1">
                  <span className="font-medium text-gray-700 dark:text-gray-300 block sm:inline">Processing:</span>
                  <div className="text-blue-600 dark:text-blue-400 font-semibold">
                    {batchProgress.processingFiles} files
                  </div>
                </div>
              </div>
              
              {showStats && stats && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 text-xs text-gray-600 dark:text-gray-400 pt-3 border-t border-gray-200 dark:border-gray-700">
                  <div className="text-center sm:text-left">
                    <span className="font-medium block sm:inline">Success Rate:</span>
                    <div>{stats.successRate.toFixed(1)}%</div>
                  </div>
                  <div className="text-center sm:text-left">
                    <span className="font-medium block sm:inline">Avg. Time:</span>
                    <div>{formatTime(stats.averageTime)}</div>
                  </div>
                  <div className="text-center sm:text-left sm:col-span-2 lg:col-span-1">
                    <span className="font-medium block sm:inline">Total Size:</span>
                    <div>{formatFileSize(stats.totalSize)}</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 現在変換中のファイル表示 */}
      {currentFile && isConverting && (
        <div className="bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg p-3 sm:p-4">
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin flex-shrink-0 mt-0.5 sm:mt-0" />
            <div className="flex-1 min-w-0">
              <p className="text-sm sm:text-base font-medium text-blue-900 dark:text-blue-100 truncate">
                Converting: {currentFile}
              </p>
              <p className="text-xs sm:text-sm text-blue-700 dark:text-blue-300">
                Processing in progress...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* ファイル個別進捗 */}
      {batchProgress && showFileDetails && variant === 'detailed' && (
        <div className="space-y-3 sm:space-y-4">
          <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100">
            File Progress ({batchProgress.fileProgresses.length} files)
          </h4>
          <div className={`${responsive ? 'grid gap-3 sm:gap-4 sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3' : 'space-y-3'}`}>
            {batchProgress.fileProgresses.map((fileProgress) => (
              <FileProgressItem
                key={fileProgress.fileId}
                progress={fileProgress}
                showDetails={showFileDetails}
                animated={animated}
              />
            ))}
          </div>
        </div>
      )}

      {/* コンパクトビューでのファイル一覧 */}
      {batchProgress && variant === 'compact' && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 sm:p-4">
          <h4 className="text-sm sm:text-base lg:text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3 sm:mb-4">
            Files ({batchProgress.fileProgresses.length})
          </h4>
          <div className="space-y-2 sm:space-y-3">
            {batchProgress.fileProgresses.map((fileProgress) => (
              <div key={fileProgress.fileId} className="flex items-center space-x-3 py-2">
                <div className="flex-1 min-w-0">
                  <div className="text-xs sm:text-sm text-gray-900 dark:text-gray-100 truncate mb-1 sm:mb-2">
                    {fileProgress.fileId}
                  </div>
                  <ProgressBar
                    percentage={fileProgress.percentage}
                    status={getProgressStatus(fileProgress.stage)}
                    size="sm"
                    animated={animated}
                    showPercentage={false}
                  />
                </div>
                <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 flex-shrink-0 font-medium">
                  {fileProgress.percentage.toFixed(0)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionProgress;