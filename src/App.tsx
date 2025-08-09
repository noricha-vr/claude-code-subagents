import { useState } from 'react';
// 型定義とユーティリティの動作確認
import { ConversionStatus, type ConversionState } from './types';
import { APP_CONFIG, formatFileSize, formatDuration } from './utils/constants';
// FFmpegサービステスト
import { createFFmpegService } from './services';

function App() {
  const [count, setCount] = useState(0);

  // 型定義とユーティリティ関数の動作テスト
  const testUtilities = () => {
    console.log('=== 型定義・ユーティリティ動作テスト ===');
    console.log('APP_CONFIG:', APP_CONFIG);
    console.log('ConversionStatus.IDLE:', ConversionStatus.IDLE);
    console.log('formatFileSize(1048576):', formatFileSize(1048576)); // 1MB
    console.log('formatDuration(125):', formatDuration(125)); // 2:05
    
    const testState: ConversionState = {
      status: ConversionStatus.IDLE,
      videoFile: null,
      mp3File: null,
      progress: null,
      errorMessage: null
    };
    console.log('Test ConversionState:', testState);
  };

  // FFmpeg.wasmサービスの動作テスト
  const testFFmpegService = async () => {
    console.log('=== FFmpeg.wasmサービス動作テスト ===');
    const ffmpegService = createFFmpegService();
    
    // 環境チェック
    console.log('Cross-Origin Isolation:', crossOriginIsolated);
    console.log('SharedArrayBuffer support:', typeof SharedArrayBuffer !== 'undefined');
    
    try {
      // FFmpegロードテスト
      console.log('FFmpeg.wasmを読み込み中...');
      await ffmpegService.loadFFmpeg((progress) => {
        console.log(`読み込み進捗: ${progress.percentage}% - ${progress.currentStep}`);
      });
      console.log('FFmpeg.wasm読み込み完了！');
      console.log('FFmpeg読み込み済み:', ffmpegService.isFFmpegLoaded());
    } catch (error) {
      console.error('FFmpeg.wasmテストエラー:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Video to MP3 Converter
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Convert video files to MP3 directly in your browser
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-sm text-gray-500 mb-4">Step 4: FFmpeg.wasmサービス実装中...</p>
          <div className="space-y-3">
            <button
              onClick={() => setCount((count) => count + 1)}
              className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors block w-full"
            >
              Count is {count}
            </button>
            <button
              onClick={testUtilities}
              className="px-6 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors block w-full"
            >
              型定義・ユーティリティ動作テスト
            </button>
            <button
              onClick={testFFmpegService}
              className="px-6 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 transition-colors block w-full"
            >
              FFmpeg.wasmサービステスト
            </button>
          </div>
          <div className="mt-4 text-xs text-gray-400">
            <p>✅ TypeScript型定義完了</p>
            <p>✅ ユーティリティ関数完了</p>
            <p>✅ 定数定義完了</p>
            <p>🔄 FFmpeg.wasmサービス実装</p>
            <p>⚠️ ブラウザコンソールでテスト結果を確認してください</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;