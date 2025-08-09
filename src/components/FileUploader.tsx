/**
 * FileUploader - ドラッグ&ドロップ対応ファイルアップロードコンポーネント
 * 動画ファイルの選択、検証、プレビュー表示機能
 */

import React, { useState, useRef, useCallback } from 'react';
import type { DragState } from '../types';
import { useConversion } from '../hooks';
import { formatFileSize, formatDuration } from '../utils/fileUtils';
import { SUPPORTED_VIDEO_TYPES } from '../utils/constants';

/**
 * FileUploaderコンポーネントのProps
 */
interface FileUploaderProps {
  /** クラス名（TailwindCSS） */
  className?: string;
  /** 無効状態 */
  disabled?: boolean;
}

/**
 * ドラッグ&ドロップ対応ファイルアップローダー
 */
export const FileUploader: React.FC<FileUploaderProps> = ({
  className = '',
  disabled = false
}) => {
  // useConversionフックから必要な値を取得
  const { 
    state,
    selectFiles,
    reset,
    isLoading,
    hasError,
    canConvert
  } = useConversion();

  // ドラッグ&ドロップの状態管理
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isDragOver: false,
    isDroppable: false
  });

  // ファイル選択用のinput要素の参照
  const fileInputRef = useRef<HTMLInputElement>(null);

  // ドラッグ&ドロップイベントハンドラー
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    // ファイルがドラッグされているかチェック
    const hasFiles = e.dataTransfer.types.includes('Files');
    
    setDragState(prev => ({
      ...prev,
      isDragOver: true,
      isDroppable: hasFiles
    }));
  }, [disabled]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    // ドロップ可能な場合はカーソルを変更
    e.dataTransfer.dropEffect = dragState.isDroppable ? 'copy' : 'none';
  }, [disabled, dragState.isDroppable]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    // イベントターゲットがコンテナの子要素でない場合のみリセット
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    if (x < rect.left || x >= rect.right || y < rect.top || y >= rect.bottom) {
      setDragState(prev => ({
        ...prev,
        isDragOver: false,
        isDroppable: false
      }));
    }
  }, [disabled]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (disabled) return;

    setDragState({
      isDragging: false,
      isDragOver: false,
      isDroppable: false
    });

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await selectFiles(files);
    }
  }, [disabled, selectFiles]);

  // ファイル選択ボタンクリック
  const handleFileSelectClick = useCallback(() => {
    if (disabled || !fileInputRef.current) return;
    fileInputRef.current.click();
  }, [disabled]);

  // ファイル入力変更ハンドラー
  const handleFileInputChange = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await selectFiles(files);
    }
    
    // ファイル入力をリセット（同じファイルを再選択可能にする）
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [selectFiles]);

  // リセットボタンクリック
  const handleReset = useCallback(() => {
    reset();
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, [reset]);

  // スタイルクラスの計算
  const getContainerClasses = (): string => {
    const baseClasses = [
      'border-2',
      'border-dashed', 
      'rounded-lg',
      'p-8',
      'text-center',
      'transition-all',
      'duration-200',
      'ease-in-out',
      'min-h-[200px]',
      'flex',
      'flex-col',
      'items-center',
      'justify-center',
      'space-y-4'
    ];

    if (disabled || isLoading) {
      baseClasses.push(
        'bg-gray-100',
        'border-gray-300',
        'text-gray-400',
        'cursor-not-allowed'
      );
    } else if (dragState.isDragOver && dragState.isDroppable) {
      baseClasses.push(
        'bg-blue-50',
        'border-blue-400',
        'text-blue-600',
        'shadow-lg',
        'scale-105'
      );
    } else if (hasError) {
      baseClasses.push(
        'bg-red-50',
        'border-red-400',
        'text-red-600'
      );
    } else if (state.videoFile) {
      baseClasses.push(
        'bg-green-50',
        'border-green-400',
        'text-green-600'
      );
    } else {
      baseClasses.push(
        'bg-gray-50',
        'border-gray-300',
        'text-gray-600',
        'hover:bg-gray-100',
        'hover:border-gray-400',
        'cursor-pointer'
      );
    }

    return baseClasses.join(' ');
  };

  // アップロードエリアの表示内容
  const renderUploadArea = () => {
    if (isLoading) {
      return (
        <div className="flex flex-col items-center space-y-2">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <p className="text-sm font-medium">{state.progress?.currentStep || 'ファイル情報取得中...'}</p>
        </div>
      );
    }

    if (hasError && state.errorMessage) {
      return (
        <div className="flex flex-col items-center space-y-3">
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center">
            <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <p className="text-sm font-medium">{state.errorMessage}</p>
          <button
            onClick={handleReset}
            className="text-sm text-red-600 hover:text-red-700 underline focus:outline-none focus:ring-2 focus:ring-red-500 rounded"
          >
            リセット
          </button>
        </div>
      );
    }

    if (state.videoFile) {
      return renderFileInfo();
    }

    return (
      <div className="flex flex-col items-center space-y-3">
        <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
          <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        
        <div>
          <p className="text-lg font-medium mb-1">
            {dragState.isDragOver && dragState.isDroppable 
              ? 'ファイルをここにドロップ' 
              : 'ファイルをドラッグ&ドロップ'
            }
          </p>
          <p className="text-sm text-gray-500">
            または<span className="text-blue-600">クリックしてファイルを選択</span>
          </p>
        </div>

        <div className="text-xs text-gray-400">
          <p>対応形式: MP4, WebM, AVI, MOV, MKV, FLV, WMV</p>
          <p>最大サイズ: 500MB</p>
        </div>
      </div>
    );
  };

  // ファイル情報表示
  const renderFileInfo = () => {
    if (!state.videoFile) return null;

    const { videoFile } = state;
    
    return (
      <div className="w-full max-w-md space-y-4">
        {/* プレビュー画像 */}
        {videoFile.previewUrl && (
          <div className="flex justify-center">
            <img 
              src={videoFile.previewUrl} 
              alt="Video preview"
              className="max-w-40 max-h-32 rounded-lg shadow-md object-cover"
            />
          </div>
        )}

        {/* ファイル詳細 */}
        <div className="bg-white rounded-lg p-4 border border-green-200">
          <h3 className="font-semibold text-green-700 mb-3 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            ファイル情報
          </h3>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">ファイル名:</span>
              <span className="font-medium text-right flex-1 ml-2 break-all">{videoFile.name}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">サイズ:</span>
              <span className="font-medium">{formatFileSize(videoFile.size)}</span>
            </div>
            
            <div className="flex justify-between">
              <span className="text-gray-600">形式:</span>
              <span className="font-medium">{videoFile.type}</span>
            </div>
            
            {videoFile.duration && (
              <div className="flex justify-between">
                <span className="text-gray-600">長さ:</span>
                <span className="font-medium">{formatDuration(videoFile.duration)}</span>
              </div>
            )}
          </div>
        </div>

        {/* アクションボタン */}
        <div className="flex gap-2">
          <button
            onClick={handleReset}
            className="flex-1 py-2 px-4 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors"
          >
            別のファイル
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className={`file-uploader ${className}`}>
      {/* ドラッグ&ドロップエリア */}
      <div
        className={getContainerClasses()}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={state.videoFile ? undefined : handleFileSelectClick}
        role="button"
        tabIndex={disabled ? -1 : 0}
        aria-label={state.videoFile ? "アップロード済みファイル" : "ファイルをドラッグ&ドロップまたはクリックして選択"}
        onKeyDown={(e) => {
          if ((e.key === 'Enter' || e.key === ' ') && !state.videoFile && !disabled) {
            e.preventDefault();
            handleFileSelectClick();
          }
        }}
      >
        {renderUploadArea()}
      </div>

      {/* 隠しファイル入力 */}
      <input
        ref={fileInputRef}
        type="file"
        accept={SUPPORTED_VIDEO_TYPES.join(',')}
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled}
        aria-hidden="true"
      />
    </div>
  );
};

export default FileUploader;