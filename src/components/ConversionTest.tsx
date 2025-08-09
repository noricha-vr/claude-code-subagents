/**
 * useConversion フックのテストコンポーネント
 * Step 5の動作確認用
 */

import React, { useRef } from 'react';
import { useConversion } from '../hooks/useConversion';
import { formatFileSize, formatDuration } from '../utils/constants';
import { ConversionProgress } from './ConversionProgress';

/**
 * ConversionTest - useConversionフックの動作確認コンポーネント
 */
export const ConversionTest: React.FC = () => {
  const {
    state,
    selectFile,
    convertToMp3,
    downloadMp3,
    reset,
    isIdle,
    isLoading,
    isProcessing,
    isCompleted,
    hasError,
    canConvert,
    canDownload
  } = useConversion();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    console.log('Selected file:', file);
    if (file) {
      console.log('Calling selectFile with:', file.name, file.size, file.type);
      const result = await selectFile(file);
      console.log('selectFile result:', result);
      // 状態変化を確認
      console.log('After selectFile - current canConvert:', canConvert);
    }
  };

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleConvert = async () => {
    await convertToMp3();
  };

  const getStatusColor = () => {
    if (hasError) return 'text-red-600';
    if (isCompleted) return 'text-green-600';
    if (isProcessing || isLoading) return 'text-blue-600';
    return 'text-gray-600';
  };

  const getStatusText = () => {
    if (hasError) return 'エラー';
    if (isCompleted) return '変換完了';
    if (isProcessing) return '変換中';
    if (isLoading && state.progress?.currentStep.includes('メタデータ')) return 'ファイル情報取得中';
    if (isLoading) return 'ライブラリ読み込み中';
    return '待機中';
  };

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold text-gray-800 mb-6">
        useConversion フックテスト
      </h2>

      {/* 進捗表示コンポーネント（Step 7） */}
      <div className="mb-6">
        <ConversionProgress
          status={state.status}
          progress={state.progress?.percentage || 0}
          currentStep={state.progress?.currentStep || ''}
          estimatedTimeRemaining={(state.progress?.estimatedTimeLeft || 0) / 1000}
          fileName={state.videoFile?.name}
        />
      </div>

      {/* 従来のステータス表示 */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex justify-between items-center mb-2">
          <span className="font-semibold">状態:</span>
          <span className={`font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
        </div>

        {state.errorMessage && (
          <div className="mt-2 p-2 bg-red-100 border border-red-300 rounded text-red-700 text-sm">
            {state.errorMessage}
          </div>
        )}
      </div>

      {/* ファイル情報 */}
      {state.videoFile && (
        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">選択されたファイル</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">ファイル名:</span> {state.videoFile.name}
            </div>
            <div>
              <span className="font-medium">サイズ:</span> {formatFileSize(state.videoFile.size)}
            </div>
            <div>
              <span className="font-medium">形式:</span> {state.videoFile.type}
            </div>
            {state.videoFile.duration && (
              <div>
                <span className="font-medium">長さ:</span> {formatDuration(state.videoFile.duration)}
              </div>
            )}
          </div>
          {state.videoFile.previewUrl && (
            <div className="mt-2">
              <img 
                src={state.videoFile.previewUrl} 
                alt="プレビュー" 
                className="w-32 h-24 object-cover rounded"
              />
            </div>
          )}
        </div>
      )}

      {/* MP3ファイル情報 */}
      {state.mp3File && (
        <div className="mb-6 p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold text-gray-800 mb-2">変換されたMP3ファイル</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
            <div>
              <span className="font-medium">ファイル名:</span> {state.mp3File.name}
            </div>
            <div>
              <span className="font-medium">サイズ:</span> {formatFileSize(state.mp3File.size)}
            </div>
            <div>
              <span className="font-medium">ビットレート:</span> {state.mp3File.bitrate}kbps
            </div>
            <div>
              <span className="font-medium">長さ:</span> {formatDuration(state.mp3File.duration)}
            </div>
          </div>
        </div>
      )}

      {/* コントロールボタン */}
      <div className="flex flex-wrap gap-4">
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileSelect}
          className="hidden"
        />
        
        <button
          onClick={handleSelectFile}
          disabled={isLoading || isProcessing}
          className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          ファイル選択
        </button>

        <button
          onClick={handleConvert}
          disabled={!canConvert || isLoading || isProcessing}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          {isLoading ? 'ライブラリ読み込み中...' : isProcessing ? '変換中...' : 'MP3に変換'}
        </button>

        <button
          onClick={downloadMp3}
          disabled={!canDownload}
          className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          ダウンロード
        </button>

        <button
          onClick={reset}
          disabled={isLoading || isProcessing}
          className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
        >
          リセット
        </button>
      </div>

      {/* デバッグ情報（開発環境のみ） */}
      {import.meta.env.DEV && (
        <div className="mt-8 p-4 bg-yellow-50 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">デバッグ情報</h4>
          <div className="text-xs font-mono">
            <div>isIdle: {isIdle.toString()}</div>
            <div>isLoading: {isLoading.toString()}</div>
            <div>isProcessing: {isProcessing.toString()}</div>
            <div>isCompleted: {isCompleted.toString()}</div>
            <div>hasError: {hasError.toString()}</div>
            <div>canConvert: {canConvert.toString()}</div>
            <div>canDownload: {canDownload.toString()}</div>
          </div>
        </div>
      )}
    </div>
  );
};