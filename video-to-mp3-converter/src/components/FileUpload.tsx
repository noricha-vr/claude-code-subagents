import React, { useState, useRef, useCallback } from 'react'
import { VideoFile } from '../types'

interface FileUploadProps {
  onFileSelect: (file: VideoFile) => void
  selectedFile: VideoFile | null
}

const SUPPORTED_VIDEO_TYPES = [
  'video/mp4',
  'video/avi', 
  'video/mov',
  'video/quicktime',
  'video/x-msvideo',
  'video/webm',
  'video/x-ms-wmv',
  'video/3gpp',
  'video/x-flv',
  'video/x-matroska',
  'video/mkv'
]

const MAX_FILE_SIZE = 500 * 1024 * 1024 // 500MB

const FileUpload: React.FC<FileUploadProps> = ({ onFileSelect, selectedFile }) => {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  const validateFile = (file: File): string | null => {
    // Check file type
    const isSupported = SUPPORTED_VIDEO_TYPES.includes(file.type) ||
                       file.name.toLowerCase().match(/\.(mp4|avi|mov|webm|mkv|wmv|3gp|flv|m4v|ts|mts)$/)
    
    if (!isSupported) {
      return 'サポートされていないファイル形式です。MP4、AVI、MOV、WebM、MKVなどの動画ファイルを選択してください。'
    }

    // Check file size
    if (file.size > MAX_FILE_SIZE) {
      return `ファイルサイズが大きすぎます。${formatFileSize(MAX_FILE_SIZE)}以下のファイルを選択してください。`
    }

    return null
  }

  const processFile = useCallback(async (file: File) => {
    setIsProcessing(true)
    
    const error = validateFile(file)
    if (error) {
      alert(error)
      setIsProcessing(false)
      return
    }

    try {
      // Create video element to get metadata
      const video = document.createElement('video')
      const objectUrl = URL.createObjectURL(file)
      
      video.preload = 'metadata'
      video.src = objectUrl
      
      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => {
          const videoFile: VideoFile = {
            file,
            name: file.name,
            size: file.size,
            duration: video.duration,
            format: file.type || 'unknown'
          }
          
          onFileSelect(videoFile)
          URL.revokeObjectURL(objectUrl)
          resolve()
        }
        
        video.onerror = () => {
          URL.revokeObjectURL(objectUrl)
          reject(new Error('動画ファイルの読み込みに失敗しました'))
        }
      })
    } catch (error) {
      console.error('File processing error:', error)
      alert('ファイルの処理中にエラーが発生しました')
    } finally {
      setIsProcessing(false)
    }
  }, [onFileSelect])

  const handleFileInput = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      processFile(file)
    }
    // Reset input value to allow selecting the same file again
    event.target.value = ''
  }, [processFile])

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault()
    event.stopPropagation()
    setIsDragOver(false)

    const files = event.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }, [processFile])

  const handleClick = useCallback(() => {
    if (!isProcessing) {
      fileInputRef.current?.click()
    }
  }, [isProcessing])

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-4">
      <div
        className={`upload-area ${isDragOver ? 'dragover' : ''} ${isProcessing ? 'opacity-50 cursor-not-allowed' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={handleClick}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="video/*"
          onChange={handleFileInput}
          className="hidden"
          disabled={isProcessing}
        />

        {isProcessing ? (
          <div className="flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
            <p className="text-gray-600">ファイルを処理中...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="mb-4">
              <svg
                className="w-16 h-16 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2h4a1 1 0 110 2h-1v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6H3a1 1 0 110-2h4zM6 6v12h12V6H6zm2-2V2h8v2H8z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1}
                  d="M10 9l2 2 2-2M12 11v6"
                />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-700 mb-2">
              動画ファイルを選択またはドラッグ&ドロップ
            </p>
            <p className="text-sm text-gray-500 mb-4 text-center">
              サポート形式: MP4, AVI, MOV, WebM, MKV, WMV など<br />
              最大ファイルサイズ: {formatFileSize(MAX_FILE_SIZE)}
            </p>
            <button
              type="button"
              className="btn-primary"
              disabled={isProcessing}
            >
              ファイルを選択
            </button>
          </div>
        )}
      </div>

      {selectedFile && (
        <div className="bg-gray-50 rounded-lg p-4">
          <h3 className="font-semibold text-gray-800 mb-3">選択されたファイル</h3>
          <div className="space-y-2">
            <div className="flex justify-between items-start">
              <span className="text-sm text-gray-600">ファイル名:</span>
              <span className="text-sm font-medium text-gray-800 text-right ml-2 break-all">
                {selectedFile.name}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">サイズ:</span>
              <span className="text-sm text-gray-800">
                {formatFileSize(selectedFile.size)}
              </span>
            </div>
            {selectedFile.duration && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">再生時間:</span>
                <span className="text-sm text-gray-800">
                  {formatDuration(selectedFile.duration)}
                </span>
              </div>
            )}
            {selectedFile.format && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">形式:</span>
                <span className="text-sm text-gray-800">
                  {selectedFile.format}
                </span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default FileUpload