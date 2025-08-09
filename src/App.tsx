import React, { useEffect } from 'react';
import { useConversion } from './hooks';
import { FileUploader, ConversionProgress, DownloadButton } from './components';
import { ConversionStatus } from './types';

/**
 * Video to MP3 Converter Application
 * 
 * ブラウザ内で動画ファイルをMP3に変換するWebアプリケーション
 * FFmpeg.wasmを使用した完全クライアントサイド処理
 * 
 * 機能:
 * - ドラッグ&ドロップによるファイル選択
 * - リアルタイム変換進捗表示
 * - MP3ファイルのダウンロード
 * - Cross-Origin Isolation環境対応
 */
function App() {
  const conversion = useConversion();

  // 環境チェック（開発用）
  useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      console.group('🔧 Environment Check');
      console.log('Cross-Origin Isolated:', crossOriginIsolated);
      console.log('SharedArrayBuffer Support:', typeof SharedArrayBuffer !== 'undefined');
      console.log('Service Worker Support:', 'serviceWorker' in navigator);
      console.groupEnd();
    }
  }, []);

  // 変換開始ハンドラー
  const handleStartConversion = () => {
    if (conversion.canConvert) {
      conversion.convertToMp3();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* ヘッダー */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Video to MP3 Converter
            </h1>
            <p className="text-gray-600 text-sm md:text-base">
              Convert video files to MP3 directly in your browser - No server upload required
            </p>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          
          {/* ファイルアップロード領域 */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Step 1: Select Video File
              </h2>
              <p className="text-gray-600 text-sm">
                Choose a video file to convert to MP3 format (128kbps)
              </p>
            </div>
            
            <FileUploader />

            {/* ファイル選択後の変換ボタン */}
            {conversion.canConvert && conversion.status === ConversionStatus.IDLE && (
              <div className="mt-6 text-center">
                <button
                  onClick={handleStartConversion}
                  className="px-8 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  🎵 Start MP3 Conversion
                </button>
              </div>
            )}
          </div>

          {/* 変換進捗領域 */}
          {(conversion.status !== ConversionStatus.IDLE || conversion.hasError) && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Step 2: Conversion Progress
                </h2>
                <p className="text-gray-600 text-sm">
                  Monitor the conversion process in real-time
                </p>
              </div>
              
              <ConversionProgress />
            </div>
          )}

          {/* ダウンロード領域 */}
          {conversion.status === ConversionStatus.COMPLETED && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Step 3: Download MP3
                </h2>
                <p className="text-gray-600 text-sm">
                  Your MP3 file is ready for download
                </p>
              </div>
              
              <DownloadButton />

              {/* 新しいファイル変換ボタン */}
              <div className="mt-6 text-center">
                <button
                  onClick={conversion.reset}
                  className="px-6 py-2 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Convert Another File
                </button>
              </div>
            </div>
          )}

          {/* エラー表示 */}
          {conversion.hasError && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 text-red-500 text-xl">⚠️</div>
                <div>
                  <h3 className="font-semibold text-red-800 mb-1">Conversion Error</h3>
                  <p className="text-red-700 text-sm mb-3">
                    {conversion.state.errorMessage || 'An unknown error occurred during conversion.'}
                  </p>
                  <button
                    onClick={conversion.reset}
                    className="px-4 py-2 bg-red-100 text-red-800 font-medium rounded-lg hover:bg-red-200 transition-colors text-sm"
                  >
                    Try Again
                  </button>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </main>

      {/* フッター */}
      <footer className="mt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white/50 rounded-xl p-6 text-sm text-gray-600">
            <p className="mb-2">
              <span className="font-medium">✨ Features:</span> Browser-only processing • No server upload • 
              Cross-Origin Isolation enabled • FFmpeg.wasm powered
            </p>
            <p className="text-xs text-gray-500">
              Best experience on Chrome with hardware acceleration enabled
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;