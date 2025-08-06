import React, { useEffect, useState } from 'react'
import { ConversionProgress as ConversionProgressType, ConversionResult } from '../types'

interface ConversionProgressProps {
  progress: ConversionProgressType
  onStart: () => void
  onReset: () => void
  result: ConversionResult | null
  onDownload: () => void
}

const ConversionProgress: React.FC<ConversionProgressProps> = ({
  progress,
  onStart,
  onReset,
  result,
  onDownload
}) => {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  // Animate progress bar
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimatedProgress(progress.progress)
    }, 100)
    return () => clearTimeout(timer)
  }, [progress.progress])

  const formatETA = (seconds: number): string => {
    if (seconds < 60) {
      return `約${Math.ceil(seconds)}秒`
    }
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.ceil(seconds % 60)
    return `約${minutes}分${remainingSeconds > 0 ? remainingSeconds + '秒' : ''}`
  }

  const getPhaseIcon = () => {
    switch (progress.phase) {
      case 'idle':
        return (
          <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'loading':
        return (
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
        )
      case 'converting':
        return (
          <svg className="w-8 h-8 text-primary-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
        )
      case 'complete':
        return (
          <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      case 'error':
        return (
          <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        )
      default:
        return null
    }
  }

  const getPhaseColor = () => {
    switch (progress.phase) {
      case 'loading':
      case 'converting':
        return 'text-primary-600'
      case 'complete':
        return 'text-green-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getProgressBarColor = () => {
    switch (progress.phase) {
      case 'complete':
        return 'bg-green-600'
      case 'error':
        return 'bg-red-600'
      default:
        return 'bg-primary-600'
    }
  }

  const canStart = progress.phase === 'idle'
  const isProcessing = progress.phase === 'loading' || progress.phase === 'converting'
  const isComplete = progress.phase === 'complete'

  return (
    <div className="space-y-6">
      {/* Progress Status */}
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          {getPhaseIcon()}
        </div>
        <div className="flex-1">
          <h3 className={`text-lg font-semibold ${getPhaseColor()}`}>
            {progress.phase === 'idle' && '準備完了'}
            {progress.phase === 'loading' && 'ライブラリ読み込み中'}
            {progress.phase === 'converting' && '変換中'}
            {progress.phase === 'complete' && '変換完了'}
            {progress.phase === 'error' && 'エラー発生'}
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            {progress.message}
          </p>
          {progress.eta && progress.eta > 0 && (
            <p className="text-xs text-gray-500 mt-1">
              推定残り時間: {formatETA(progress.eta)}
            </p>
          )}
        </div>
      </div>

      {/* Progress Bar */}
      {(isProcessing || isComplete) && (
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">進捗</span>
            <span className={`font-medium ${getPhaseColor()}`}>
              {Math.round(animatedProgress)}%
            </span>
          </div>
          <div className="progress-bar">
            <div
              className={`progress-fill ${getProgressBarColor()}`}
              style={{ width: `${animatedProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex space-x-3">
        {canStart && (
          <button
            onClick={onStart}
            className="btn-primary flex-1"
            disabled={isProcessing}
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1M12 12h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            MP3に変換開始
          </button>
        )}

        {isComplete && result?.success && (
          <button
            onClick={onDownload}
            className="btn-primary flex-1"
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
            </svg>
            MP3ファイルをダウンロード
          </button>
        )}

        {(isComplete || progress.phase === 'error') && (
          <button
            onClick={onReset}
            className="btn-secondary"
          >
            <svg className="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            リセット
          </button>
        )}
      </div>

      {/* Conversion Result Details */}
      {isComplete && result?.success && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-semibold text-green-800 mb-2 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            変換完了
          </h4>
          <div className="space-y-2 text-sm">
            {result.fileName && (
              <div className="flex justify-between">
                <span className="text-green-700">出力ファイル:</span>
                <span className="text-green-800 font-medium">{result.fileName}</span>
              </div>
            )}
            {result.duration && (
              <div className="flex justify-between">
                <span className="text-green-700">変換時間:</span>
                <span className="text-green-800 font-medium">{result.duration.toFixed(1)}秒</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-green-700">出力設定:</span>
              <span className="text-green-800 font-medium">MP3, 128kbps</span>
            </div>
          </div>
        </div>
      )}

      {/* Processing Indicator */}
      {isProcessing && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600 mr-3"></div>
            <div>
              <p className="text-blue-800 font-medium">処理中...</p>
              <p className="text-blue-600 text-sm">
                {progress.phase === 'loading' && 'FFmpeg WebAssemblyライブラリを読み込み中です。初回は少し時間がかかる場合があります。'}
                {progress.phase === 'converting' && '動画ファイルをMP3形式に変換中です。ファイルサイズによって時間がかかる場合があります。'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default ConversionProgress