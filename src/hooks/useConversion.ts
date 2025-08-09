/**
 * useConversion - 動画→MP3変換カスタムフック
 * 変換状態管理、FFmpegサービス統合、進捗追跡、エラーハンドリング
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import type {
  ConversionState,
  ConversionProgress,
  Mp3File,
  FileValidationResult
} from '../types';
import { ConversionStatus } from '../types';
import { defaultFFmpegService, type IFFmpegService } from '../services';
import { validateFile, validateFiles } from '../utils/fileUtils';
import { ERROR_MESSAGES, CONVERSION_STEPS, generateMp3Filename } from '../utils/constants';

/**
 * useConversionフックの戻り値型定義
 */
export interface UseConversionReturn {
  // 状態
  state: ConversionState;
  
  // アクション
  selectFile: (file: File) => Promise<boolean>;
  selectFiles: (files: FileList | File[]) => Promise<boolean>;
  convertToMp3: () => Promise<boolean>;
  downloadMp3: () => void;
  reset: () => void;
  
  // ユーティリティ
  isIdle: boolean;
  isLoading: boolean;
  isProcessing: boolean;
  isCompleted: boolean;
  hasError: boolean;
  canConvert: boolean;
  canDownload: boolean;
}

/**
 * 初期状態
 */
const initialState: ConversionState = {
  status: ConversionStatus.IDLE,
  videoFile: null,
  mp3File: null,
  progress: null,
  errorMessage: null
};

/**
 * useConversion - 動画→MP3変換の状態管理フック
 */
export const useConversion = (): UseConversionReturn => {
  // 状態管理
  const [state, setState] = useState<ConversionState>(initialState);
  
  // FFmpegサービスの参照（マウント中は固定）
  const ffmpegService = useRef<IFFmpegService>(defaultFFmpegService);
  const isUnmounted = useRef(false);

  /**
   * 状態を安全に更新（アンマウント後は更新しない）
   */
  const safeSetState = useCallback((newState: Partial<ConversionState>) => {
    console.log('safeSetState呼び出し:', {
      isUnmounted: isUnmounted.current,
      newState
    });
    
    if (!isUnmounted.current) {
      setState(prev => {
        const nextState = { ...prev, ...newState };
        console.log('setState実行:', { prev, newState, nextState });
        return nextState;
      });
    } else {
      console.warn('アンマウント後のため状態更新をスキップ');
    }
  }, []);

  /**
   * エラー状態を設定
   */
  const setError = useCallback((errorMessage: string) => {
    safeSetState({
      status: ConversionStatus.ERROR,
      errorMessage,
      progress: null
    });
  }, [safeSetState]);

  /**
   * プログレス更新コールバック
   */
  const onProgress = useCallback((progress: ConversionProgress) => {
    safeSetState({ progress });
  }, [safeSetState]);

  /**
   * ファイル選択処理（単一ファイル）
   */
  const selectFile = useCallback(async (file: File): Promise<boolean> => {
    try {
      // ローディング状態を設定
      safeSetState({
        status: ConversionStatus.LOADING,
        videoFile: null,
        mp3File: null,
        progress: {
          percentage: 0,
          currentStep: 'ファイルメタデータを取得中...',
          startTime: Date.now()
        },
        errorMessage: null
      });

      console.log('ファイル検証開始:', file.name, file.size, file.type);
      
      // 検証実行
      const validation: FileValidationResult = await validateFile(file);
      
      if (!validation.isValid) {
        console.error('ファイル検証失敗:', validation.errorMessage);
        setError(validation.errorMessage || ERROR_MESSAGES.UNSUPPORTED_FORMAT);
        return false;
      }

      console.log('ファイル検証成功:', validation.videoFile);
      
      // 正常ファイルを設定
      safeSetState({
        status: ConversionStatus.IDLE,
        videoFile: validation.videoFile!,
        mp3File: null,
        progress: null,
        errorMessage: null
      });
      
      return true;
    } catch (error) {
      setError(ERROR_MESSAGES.FILE_READ_FAILED);
      return false;
    }
  }, [setError, safeSetState]);

  /**
   * ファイル選択処理（複数ファイル対応）
   */
  const selectFiles = useCallback(async (files: FileList | File[]): Promise<boolean> => {
    try {
      // ローディング状態を設定
      safeSetState({
        status: ConversionStatus.LOADING,
        videoFile: null,
        mp3File: null,
        progress: {
          percentage: 0,
          currentStep: 'ファイルメタデータを取得中...',
          startTime: Date.now()
        },
        errorMessage: null
      });

      console.log('複数ファイル検証開始:', files.length, 'ファイル');
      
      // 最初の有効ファイルを検索
      const validation: FileValidationResult = await validateFiles(files);
      
      if (!validation.isValid) {
        console.error('複数ファイル検証失敗:', validation.errorMessage);
        setError(validation.errorMessage || ERROR_MESSAGES.UNSUPPORTED_FORMAT);
        return false;
      }

      console.log('複数ファイル検証成功:', validation.videoFile);
      
      // 正常ファイルを設定
      safeSetState({
        status: ConversionStatus.IDLE,
        videoFile: validation.videoFile!,
        mp3File: null,
        progress: null,
        errorMessage: null
      });
      
      return true;
    } catch (error) {
      setError(ERROR_MESSAGES.FILE_READ_FAILED);
      return false;
    }
  }, [setError, safeSetState]);

  /**
   * MP3変換処理
   */
  const convertToMp3 = useCallback(async (): Promise<boolean> => {
    if (!state.videoFile) {
      setError('変換するファイルが選択されていません');
      return false;
    }

    try {
      // FFmpeg.wasmのロード状態確認
      if (!ffmpegService.current.isFFmpegLoaded()) {
        safeSetState({
          status: ConversionStatus.LOADING,
          progress: {
            percentage: 0,
            currentStep: CONVERSION_STEPS.INITIALIZING,
            startTime: Date.now()
          },
          errorMessage: null
        });

        // FFmpeg.wasmロード
        await ffmpegService.current.loadFFmpeg(onProgress);
      }

      // 変換開始
      safeSetState({
        status: ConversionStatus.PROCESSING,
        progress: {
          percentage: 0,
          currentStep: CONVERSION_STEPS.LOADING_FILE,
          startTime: Date.now()
        }
      });

      // MP3変換実行
      const mp3Result: Mp3File = await ffmpegService.current.convertToMp3(
        state.videoFile,
        onProgress
      );

      // 変換完了
      safeSetState({
        status: ConversionStatus.COMPLETED,
        mp3File: mp3Result,
        progress: {
          percentage: 100,
          currentStep: CONVERSION_STEPS.COMPLETED,
          startTime: state.progress?.startTime || Date.now(),
          estimatedTimeLeft: 0
        }
      });

      return true;
    } catch (error) {
      
      // エラー詳細分析
      let errorMessage: string = ERROR_MESSAGES.CONVERSION_FAILED;
      if (error instanceof Error) {
        if (error.message.includes('SharedArrayBuffer')) {
          errorMessage = ERROR_MESSAGES.SHARED_ARRAY_BUFFER_UNAVAILABLE;
        } else if (error.message.includes('Cross-Origin')) {
          errorMessage = ERROR_MESSAGES.CROSS_ORIGIN_ISOLATION_REQUIRED;
        } else if (error.message.includes('FFmpeg')) {
          errorMessage = ERROR_MESSAGES.FFMPEG_LOAD_FAILED;
        }
      }
      
      setError(errorMessage);
      return false;
    }
  }, [state.videoFile, state.progress?.startTime, setError, safeSetState, onProgress]);

  /**
   * MP3ファイルダウンロード
   */
  const downloadMp3 = useCallback(() => {
    if (!state.mp3File || !state.videoFile) {
      return;
    }

    try {
      // ダウンロード実行
      const link = document.createElement('a');
      link.href = state.mp3File.url;
      link.download = generateMp3Filename(state.videoFile.file.name);
      link.style.display = 'none';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      setError('ダウンロードに失敗しました');
    }
  }, [state.mp3File, state.videoFile, setError]);

  /**
   * 状態リセット
   */
  const reset = useCallback(() => {
    // Blob URLのクリーンアップ
    if (state.mp3File?.url) {
      try {
        URL.revokeObjectURL(state.mp3File.url);
      } catch (error) {
        // Cleanup error ignored
      }
    }

    // プレビューURLのクリーンアップ
    if (state.videoFile?.previewUrl && state.videoFile.previewUrl.startsWith('data:')) {
      // data URLの場合はクリーンアップ不要
    }

    // 状態をリセット
    safeSetState(initialState);
  }, [state.mp3File?.url, state.videoFile?.previewUrl, safeSetState]);

  /**
   * コンポーネントマウント・アンマウント時の処理
   */
  useEffect(() => {
    isUnmounted.current = false;
    
    return () => {
      isUnmounted.current = true;
      
      // Blob URLのクリーンアップ
      if (state.mp3File?.url) {
        try {
          URL.revokeObjectURL(state.mp3File.url);
        } catch (error) {
          // Cleanup error ignored
        }
      }
    };
  }, [state.mp3File?.url]);

  // 計算プロパティ
  const isIdle = state.status === ConversionStatus.IDLE;
  const isLoading = state.status === ConversionStatus.LOADING;
  const isProcessing = state.status === ConversionStatus.PROCESSING;
  const isCompleted = state.status === ConversionStatus.COMPLETED;
  const hasError = state.status === ConversionStatus.ERROR;
  const canConvert = !!(state.videoFile && (isIdle || hasError));
  const canDownload = !!(state.mp3File && isCompleted);
  

  return {
    // 状態
    state,
    
    // アクション
    selectFile,
    selectFiles,
    convertToMp3,
    downloadMp3,
    reset,
    
    // 計算プロパティ
    isIdle,
    isLoading,
    isProcessing,
    isCompleted,
    hasError,
    canConvert,
    canDownload
  };
};