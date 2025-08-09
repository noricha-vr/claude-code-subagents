import React from 'react';
import { ConversionStatus } from '../types';
import { useConversion } from '../hooks';

export const ConversionProgress: React.FC = () => {
  const { state, isLoading, isProcessing, hasError } = useConversion();
  
  const status = state.status;
  const progress = state.progress?.percentage || 0;
  const currentStep = state.progress?.currentStep || '';
  const estimatedTimeRemaining = state.progress?.estimatedTimeLeft || 0;
  const fileName = state.videoFile?.name;
  // 進捗状況に応じたメッセージ
  const getStatusMessage = (): string => {
    switch (status) {
      case ConversionStatus.LOADING:
        return 'FFmpeg.wasmを初期化中...';
      case ConversionStatus.PROCESSING:
        return currentStep || 'MP3に変換中...';
      case ConversionStatus.COMPLETED:
        return '変換が完了しました！';
      case ConversionStatus.ERROR:
        return '変換中にエラーが発生しました';
      default:
        return '';
    }
  };

  // 推定残り時間のフォーマット
  const formatTimeRemaining = (seconds: number): string => {
    if (seconds <= 0) return '';
    
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    
    if (minutes > 0) {
      return `残り ${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `残り ${remainingSeconds}秒`;
  };

  // プログレスバーの色を決定
  const getProgressColor = (): string => {
    switch (status) {
      case ConversionStatus.LOADING:
        return 'bg-blue-500';
      case ConversionStatus.PROCESSING:
        return 'bg-green-500';
      case ConversionStatus.COMPLETED:
        return 'bg-green-600';
      case ConversionStatus.ERROR:
        return 'bg-red-500';
      default:
        return 'bg-gray-400';
    }
  };

  // アニメーション用のクラス
  const getAnimationClass = (): string => {
    if (status === ConversionStatus.LOADING || status === ConversionStatus.PROCESSING) {
      return 'animate-pulse';
    }
    return '';
  };

  if (!isLoading && !isProcessing && !hasError) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white rounded-lg shadow-md border border-gray-200">
      {/* ファイル名表示 */}
      {fileName && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 mb-1">変換中のファイル:</p>
          <p className="text-base font-medium text-gray-800 truncate" title={fileName}>
            {fileName}
          </p>
        </div>
      )}

      {/* 状況メッセージ */}
      <div className={`mb-4 ${getAnimationClass()}`}>
        <p className="text-base font-medium text-gray-800 mb-2">
          {getStatusMessage()}
        </p>
        
        {/* 進捗率表示 */}
        {(status === ConversionStatus.LOADING || status === ConversionStatus.PROCESSING) && (
          <p className="text-sm text-gray-600">
            {Math.round(progress)}%
            {estimatedTimeRemaining > 0 && (
              <span className="ml-2">
                ({formatTimeRemaining(estimatedTimeRemaining)})
              </span>
            )}
          </p>
        )}
      </div>

      {/* プログレスバー */}
      <div className="relative">
        <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
          <div 
            className={`h-full transition-all duration-300 ease-out ${getProgressColor()}`}
            style={{ 
              width: `${Math.min(Math.max(progress, 0), 100)}%`,
              transition: 'width 0.3s ease-out'
            }}
          >
            {/* グラデーション効果 */}
            <div className="h-full bg-gradient-to-r from-transparent via-white to-transparent opacity-30 animate-shimmer"></div>
          </div>
        </div>

        {/* パルスアニメーション用のオーバーレイ */}
        {(status === ConversionStatus.LOADING || status === ConversionStatus.PROCESSING) && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white to-transparent opacity-20 animate-pulse rounded-full"></div>
        )}
      </div>

      {/* 完了時のメッセージ */}
      {status === ConversionStatus.COMPLETED && (
        <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
          <div className="flex items-center">
            <svg 
              className="w-5 h-5 text-green-600 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd" 
              />
            </svg>
            <p className="text-sm font-medium text-green-800">
              MP3ファイルのダウンロード準備完了
            </p>
          </div>
        </div>
      )}

      {/* エラー時のメッセージ */}
      {status === ConversionStatus.ERROR && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <div className="flex items-center">
            <svg 
              className="w-5 h-5 text-red-600 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" 
                clipRule="evenodd" 
              />
            </svg>
            <p className="text-sm font-medium text-red-800">
              変換に失敗しました。もう一度お試しください。
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConversionProgress;