/**
 * FFmpeg.wasmサービスのテスト（開発用）
 * ブラウザのコンソールで動作確認
 */

import { createFFmpegService } from './index';
import type { VideoFile, ConversionProgress } from '../types';

// グローバルに公開してブラウザコンソールからテスト可能に
declare global {
  interface Window {
    testFFmpegService: () => Promise<void>;
    ffmpegService: ReturnType<typeof createFFmpegService>;
  }
}

// FFmpegサービスインスタンス
const ffmpegService = createFFmpegService();

/**
 * FFmpeg.wasmサービスのテスト関数
 */
async function testFFmpegService(): Promise<void> {
  console.log('FFmpeg.wasmサービステスト開始');

  // 環境チェック
  console.log('Cross-Origin Isolation:', crossOriginIsolated);
  console.log('SharedArrayBuffer support:', typeof SharedArrayBuffer !== 'undefined');

  try {
    // FFmpegロードテスト
    console.log('FFmpeg.wasmを読み込み中...');
    await ffmpegService.loadFFmpeg((progress: ConversionProgress) => {
      console.log(`読み込み進捗: ${progress.percentage}% - ${progress.currentStep}`);
    });
    console.log('FFmpeg.wasm読み込み完了！');

    // 状態確認
    console.log('FFmpeg読み込み済み:', ffmpegService.isFFmpegLoaded());
    
  } catch (error) {
    console.error('FFmpeg.wasmテストエラー:', error);
  }
}

// グローバルに公開
window.testFFmpegService = testFFmpegService;
window.ffmpegService = ffmpegService;

console.log('FFmpeg.wasmサービステスト用関数を準備しました。');
console.log('ブラウザコンソールで以下を実行してください:');
console.log('- window.testFFmpegService() // FFmpeg読み込みテスト');
console.log('- window.ffmpegService // サービスインスタンス確認');

export { testFFmpegService, ffmpegService };