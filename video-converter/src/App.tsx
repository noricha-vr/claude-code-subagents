import React, { useState, useCallback, useRef } from 'react';
import type { 
  VideoFile, 
  ConvertedFile, 
  ConversionProgress, 
  ConversionResult, 
  DragState,
  FFmpegInstance
} from '@/types';
import { ConversionStatus } from '@/types';
import { FileUploader } from '@/components/FileUploader';
import { ConversionProgress as ConversionProgressComponent } from '@/components/ConversionProgress';
import { FileInfo } from '@/components/FileInfo';
import { DownloadButton } from '@/components/DownloadButton';
import { ErrorDisplay } from '@/components/ErrorDisplay';
import { FFmpegService } from '@/services/ffmpeg';
import { FileValidator } from '@/utils/fileValidator';
import { ErrorHandler } from '@/utils/errorHandler';

function App() {
  // State management
  const [files, setFiles] = useState<VideoFile[]>([]);
  const [conversions, setConversions] = useState<Map<string, ConversionProgress>>(new Map());
  const [convertedFiles, setConvertedFiles] = useState<Map<string, ConvertedFile>>(new Map());
  const [ffmpegInstance, setFFmpegInstance] = useState<FFmpegInstance>({
    loaded: false,
    ready: false
  });
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    isValidDrop: false
  });
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Service reference
  const ffmpegService = useRef<FFmpegService | null>(null);

  // Initialize FFmpeg service
  const initializeFFmpeg = useCallback(async () => {
    if (ffmpegService.current?.ready) return;

    try {
      setFFmpegInstance(prev => ({ ...prev, error: undefined }));
      
      if (!ffmpegService.current) {
        ffmpegService.current = new FFmpegService();
      }

      await ffmpegService.current.initialize((progress) => {
        // Update loading progress
        console.log(`FFmpeg loading: ${progress}%`);
      });

      setFFmpegInstance({
        loaded: true,
        ready: true
      });

    } catch (error) {
      const conversionError = ErrorHandler.createError(
        'ffmpeg_load_failed',
        'Failed to initialize FFmpeg',
        error instanceof Error ? error.message : String(error)
      );
      
      setFFmpegInstance({
        loaded: false,
        ready: false,
        error: conversionError.message
      });

      setGlobalError(ErrorHandler.getUserFriendlyMessage(conversionError));
      ErrorHandler.logError(conversionError);
    }
  }, []);

  // Handle file selection
  const handleFilesSelected = useCallback(async (selectedFiles: File[]) => {
    // Validate files
    const validation = FileValidator.validateMultipleFiles(selectedFiles);
    if (!validation.isValid && validation.error) {
      setGlobalError(ErrorHandler.getUserFriendlyMessage(validation.error));
      return;
    }

    setGlobalError(null);

    // Convert File objects to VideoFile objects
    const videoFiles: VideoFile[] = selectedFiles.map(file => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      size: file.size,
      type: file.type
    }));

    setFiles(prev => [...prev, ...videoFiles]);
    
    // Initialize FFmpeg if not ready
    if (!ffmpegInstance.ready) {
      await initializeFFmpeg();
    }
  }, [ffmpegInstance.ready, initializeFFmpeg]);

  // Handle conversion
  const handleConvertFile = useCallback(async (fileId: string) => {
    const file = files.find(f => f.id === fileId);
    if (!file || !ffmpegService.current) return;

    try {
      const result: ConversionResult = await ffmpegService.current.convertToMP3(
        file.file,
        (progress: ConversionProgress) => {
          setConversions(prev => new Map(prev).set(fileId, progress));
        }
      );

      if (result.success && result.convertedFile) {
        // Create download URL
        const blob = new Blob([result.convertedFile.data], { type: 'audio/mp3' });
        const url = URL.createObjectURL(blob);
        
        const convertedFile = {
          ...result.convertedFile,
          url
        };

        setConvertedFiles(prev => new Map(prev).set(fileId, convertedFile));
      } else if (result.error) {
        setGlobalError(ErrorHandler.getUserFriendlyMessage(result.error));
        ErrorHandler.logError(result.error, { fileId, fileName: file.name });
      }

    } catch (error) {
      const conversionError = ErrorHandler.createError(
        'conversion_failed',
        'Conversion process failed',
        error instanceof Error ? error.message : String(error)
      );
      
      setGlobalError(ErrorHandler.getUserFriendlyMessage(conversionError));
      ErrorHandler.logError(conversionError, { fileId, fileName: file.name });

      // Update conversion status to error
      setConversions(prev => {
        const newMap = new Map(prev);
        newMap.set(fileId, {
          fileId,
          status: ConversionStatus.ERROR,
          progress: 0,
          currentStep: 'Conversion failed'
        });
        return newMap;
      });
    }
  }, [files]);

  // Handle file removal
  const handleRemoveFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
    setConversions(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
    
    // Clean up converted file URL
    const convertedFile = convertedFiles.get(fileId);
    if (convertedFile?.url) {
      URL.revokeObjectURL(convertedFile.url);
    }
    
    setConvertedFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileId);
      return newMap;
    });
  }, [convertedFiles]);

  // Handle drag and drop
  const handleDragStateChange = useCallback((newDragState: DragState) => {
    setDragState(newDragState);
  }, []);

  // Clear global error
  const handleClearError = useCallback(() => {
    setGlobalError(null);
  }, []);

  // Convert all files
  const handleConvertAll = useCallback(() => {
    files.forEach(file => {
      const conversion = conversions.get(file.id);
      if (!conversion || conversion.status === ConversionStatus.IDLE) {
        handleConvertFile(file.id);
      }
    });
  }, [files, conversions, handleConvertFile]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <header className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            Video to MP3 Converter
          </h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Convert your video files to high-quality MP3 audio (128kbps) directly in your browser. 
            No uploads required - everything happens locally!
          </p>
        </header>

        {/* Global Error Display */}
        {globalError && (
          <ErrorDisplay
            message={globalError}
            onDismiss={handleClearError}
            className="mb-6"
          />
        )}

        {/* FFmpeg Loading Status */}
        {!ffmpegInstance.ready && !ffmpegInstance.error && (
          <div className="glass-effect rounded-lg p-6 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-gray-700">Loading converter...</span>
            </div>
          </div>
        )}

        {/* Main Content */}
        <div className="space-y-6">
          {/* File Uploader */}
          <FileUploader
            onFilesSelected={handleFilesSelected}
            onDragStateChange={handleDragStateChange}
            dragState={dragState}
            disabled={!ffmpegInstance.ready}
            maxFiles={10}
            acceptedFormats={FileValidator.getSupportedFormats()}
          />

          {/* File List and Conversions */}
          {files.length > 0 && (
            <div className="glass-effect rounded-lg p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-semibold text-gray-900">
                  Files ({files.length})
                </h2>
                {files.length > 1 && (
                  <button
                    onClick={handleConvertAll}
                    disabled={!ffmpegInstance.ready}
                    className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Convert All
                  </button>
                )}
              </div>

              <div className="space-y-4">
                {files.map((file) => {
                  const conversion = conversions.get(file.id);
                  const convertedFile = convertedFiles.get(file.id);

                  return (
                    <div
                      key={file.id}
                      className="border border-gray-200 rounded-lg p-4 bg-white/50"
                    >
                      {/* File Info */}
                      <FileInfo
                        file={file}
                        onRemove={() => handleRemoveFile(file.id)}
                        onConvert={() => handleConvertFile(file.id)}
                        isConverting={conversion?.status === ConversionStatus.PROCESSING}
                        isConverted={convertedFile !== undefined}
                        disabled={!ffmpegInstance.ready}
                      />

                      {/* Conversion Progress */}
                      {conversion && (
                        <ConversionProgressComponent
                          progress={conversion}
                          className="mt-4"
                        />
                      )}

                      {/* Download Button */}
                      {convertedFile && (
                        <DownloadButton
                          file={convertedFile}
                          className="mt-4"
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Instructions */}
          {files.length === 0 && ffmpegInstance.ready && (
            <div className="text-center text-gray-600 py-8">
              <div className="space-y-4">
                <div className="text-5xl">🎵</div>
                <h3 className="text-lg font-medium">Ready to convert!</h3>
                <p>Drop your video files above or click to select them.</p>
                <div className="text-sm text-gray-500 space-y-1">
                  <p>Supported formats: {FileValidator.getSupportedFormats().join(', ')}</p>
                  <p>Maximum file size: {FileValidator.formatFileSize(FileValidator.getMaxFileSize())}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <footer className="text-center mt-12 pt-8 border-t border-gray-200">
          <p className="text-sm text-gray-500">
            All conversions happen in your browser. No files are uploaded to any server.
          </p>
        </footer>
      </div>
    </div>
  );
}

export default App;