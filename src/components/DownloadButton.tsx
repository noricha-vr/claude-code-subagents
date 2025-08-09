/**
 * DownloadButton - MP3ダウンロードコンポーネント
 * 変換完了後にMP3ファイルのダウンロードボタンを表示
 */

import React, { useState } from 'react';
import type { UseConversionReturn } from '../hooks/useConversion';
import { ConversionStatus } from '../types';
import { formatFileSize } from '../utils/fileUtils';

/**
 * DownloadButtonコンポーネントのProps
 */
export interface DownloadButtonProps {
  /** useConversionフックの戻り値 */
  conversionReturn: UseConversionReturn;
}

/**
 * ダウンロードボタンコンポーネント
 * COMPLETED状態でのみ表示され、MP3ファイルのダウンロード機能を提供
 */
export const DownloadButton: React.FC<DownloadButtonProps> = ({ conversionReturn }) => {
  const { state, downloadMp3, canDownload } = conversionReturn;
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // COMPLETED状態でない場合、または mp3File がない場合は非表示
  if (state.status !== ConversionStatus.COMPLETED || !state.mp3File || !canDownload) {
    return null;
  }

  const { mp3File, videoFile } = state;

  /**
   * ダウンロード処理実行
   */
  const handleDownload = async () => {
    if (!mp3File || !videoFile || isDownloading) return;

    try {
      setIsDownloading(true);
      
      // useConversionフックのdownloadMp3メソッドを実行
      downloadMp3();
      
      // 成功フィードバック表示
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 3000); // 3秒後にフィードバック非表示
      
    } catch (error) {
      console.error('ダウンロードエラー:', error);
      // エラー時は状態をリセット
      setDownloadSuccess(false);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 変換完了メッセージ */}
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
        <div className="flex items-center">
          {/* 成功アイコン */}
          <div className="flex-shrink-0">
            <svg 
              className="w-5 h-5 text-green-500" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              aria-hidden="true"
            >
              <path 
                fillRule="evenodd" 
                d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                clipRule="evenodd"
              />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-green-800">
              変換完了
            </h3>
            <p className="text-sm text-green-700">
              MP3ファイルの準備が完了しました
            </p>
          </div>
        </div>
      </div>

      {/* ファイル情報表示 */}
      <div className="bg-white border border-gray-200 rounded-lg p-4 mb-4">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          変換結果
        </h4>
        <div className="space-y-2 text-sm text-gray-600">
          <div className="flex justify-between">
            <span>ファイル名:</span>
            <span className="font-medium text-gray-900 truncate ml-2 max-w-[200px]" title={mp3File.name}>
              {mp3File.name}
            </span>
          </div>
          <div className="flex justify-between">
            <span>ファイルサイズ:</span>
            <span className="font-medium text-gray-900">
              {formatFileSize(mp3File.size)}
            </span>
          </div>
          <div className="flex justify-between">
            <span>ビットレート:</span>
            <span className="font-medium text-gray-900">
              {mp3File.bitrate} kbps
            </span>
          </div>
          <div className="flex justify-between">
            <span>継続時間:</span>
            <span className="font-medium text-gray-900">
              {Math.round(mp3File.duration)}秒
            </span>
          </div>
        </div>
      </div>

      {/* ダウンロードボタン */}
      <button
        onClick={handleDownload}
        disabled={isDownloading}
        className={`
          w-full flex items-center justify-center px-6 py-3 rounded-lg
          text-white font-medium text-base
          transition-all duration-300 ease-in-out
          transform hover:scale-105 active:scale-95
          ${isDownloading 
            ? 'bg-gray-400 cursor-not-allowed opacity-75' 
            : downloadSuccess
              ? 'bg-green-500 hover:bg-green-600 shadow-lg shadow-green-500/25'
              : 'bg-blue-500 hover:bg-blue-600 shadow-lg shadow-blue-500/25'
          }
        `}
        aria-label={`MP3ファイル ${mp3File.name} をダウンロード`}
      >
        {isDownloading ? (
          <>
            {/* ローディングスピナー */}
            <svg 
              className="animate-spin -ml-1 mr-2 h-5 w-5 text-white" 
              xmlns="http://www.w3.org/2000/svg" 
              fill="none" 
              viewBox="0 0 24 24"
            >
              <circle 
                className="opacity-25" 
                cx="12" 
                cy="12" 
                r="10" 
                stroke="currentColor" 
                strokeWidth="4"
              />
              <path 
                className="opacity-75" 
                fill="currentColor" 
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
            ダウンロード中...
          </>
        ) : downloadSuccess ? (
          <>
            {/* 成功チェックアイコン */}
            <svg 
              className="w-5 h-5 mr-2" 
              fill="currentColor" 
              viewBox="0 0 20 20"
            >
              <path 
                fillRule="evenodd" 
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" 
                clipRule="evenodd"
              />
            </svg>
            ダウンロード完了！
          </>
        ) : (
          <>
            {/* ダウンロードアイコン */}
            <svg 
              className="w-5 h-5 mr-2" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={2} 
                d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            MP3ファイルをダウンロード
          </>
        )}
      </button>

      {/* ダウンロード成功メッセージ */}
      {downloadSuccess && (
        <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-md">
          <p className="text-sm text-green-700 text-center">
            ダウンロードが開始されました
          </p>
        </div>
      )}
    </div>
  );
};