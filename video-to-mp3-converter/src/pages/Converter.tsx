import FileUpload from '../components/FileUpload'
import ConversionProgress from '../components/ConversionProgress'
import DownloadButton from '../components/DownloadButton'
import { useFileUploadOperations } from '../hooks/useFileUpload'
import { useVideoConverter } from '../hooks/useVideoConverter'
import { useDownload } from '../hooks/useDownload'
import { useApp } from '../context/AppContext'

const Converter = () => {
  const { state } = useApp()
  const fileUpload = useFileUploadOperations()
  
  // Video converter hook for progress tracking and conversion
  const videoConverter = useVideoConverter({
    autoInitialize: true,
    onConversionComplete: (result) => {
      console.log('Conversion complete:', result);
      // Update file upload status
      fileUpload.updateFileStatus(result.fileId, 'success', undefined, {
        data: result.convertedData || new Uint8Array(),
        filename: `${result.originalFile.name.replace(/\.[^/.]+$/, '')}.mp3`
      });
    },
    onBatchComplete: (result) => {
      console.log('=== DETAILED Batch conversion complete ===');
      console.log('Result:', result);
      console.log('Results array length:', result.results.length);
      console.log('Success count:', result.successCount);
      
      // Update all successful conversions
      result.results.forEach((conversionResult, index) => {
        console.log(`=== Processing result ${index} ===`);
        console.log('Conversion result:', conversionResult);
        console.log('File ID:', conversionResult.fileId);
        console.log('Success:', conversionResult.success);
        console.log('Has convertedData:', !!conversionResult.convertedData);
        console.log('ConvertedData length:', conversionResult.convertedData?.length);
        
        if (conversionResult.success && conversionResult.convertedData) {
          console.log('Updating file status to success...');
          fileUpload.updateFileStatus(conversionResult.fileId, 'success', undefined, {
            data: conversionResult.convertedData,
            filename: `${conversionResult.originalFile.name.replace(/\.[^/.]+$/, '')}.mp3`
          });
          console.log('File status updated');
        } else {
          console.log('Skipping file status update - conditions not met');
        }
      });
    },
    onError: (error, fileId) => {
      console.error('Conversion error:', error, fileId);
      if (fileId) {
        const errorMessage = typeof error === 'string' ? error : (error as any)?.message || 'Conversion error';
        fileUpload.updateFileStatus(fileId, 'error', errorMessage);
      }
    }
  })

  // Download hook for file downloads
  const download = useDownload({
    defaultDownloadOptions: {
      format: 'mp3',
      useOriginalName: true
    },
    defaultBatchOptions: {
      format: 'zip',
      archiveName: `converted-audio-${new Date().toISOString().slice(0, 10)}.zip`,
      compression: 'fast'
    },
    onDownloadStart: () => {
      console.log('Download started');
    },
    onDownloadComplete: (result) => {
      console.log('Download completed:', result);
    },
    onDownloadError: (error) => {
      console.error('Download error:', error);
    }
  })
  
  // Use global state instead of local state for environment checks
  const isEnvironmentReady = state.environment.crossOriginIsolated && state.environment.sharedArrayBufferSupported

  // Handle conversion start
  const handleStartConversion = async () => {
    if (fileUpload.pendingFiles.length === 0) return;
    
    try {
      await videoConverter.convertBatch(fileUpload.pendingFiles);
    } catch (error) {
      console.error('Failed to start conversion:', error);
    }
  }

  return (
    <div className="space-y-4 sm:space-y-6 lg:space-y-8">
      {/* Environment Status Check */}
      <div className="card-mobile animate-fade-in">
        <div className="card-header">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
            Environment Status
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Checking compatibility for video conversion
          </p>
        </div>

        <div className="space-y-3 sm:space-y-4">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-0">
            <span className="font-medium text-sm sm:text-base">Cross-Origin Isolated:</span>
            <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-center ${
              state.environment.crossOriginIsolated 
                ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                : 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300'
            }`}>
              {state.environment.crossOriginIsolated ? 'Ready ✅' : 'Not Ready ❌'}
            </span>
          </div>
          
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-0">
            <span className="font-medium text-sm sm:text-base">SharedArrayBuffer:</span>
            <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-center ${
              state.environment.sharedArrayBufferSupported 
                ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                : 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300'
            }`}>
              {state.environment.sharedArrayBufferSupported ? 'Available ✅' : 'Unavailable ❌'}
            </span>
          </div>

          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center p-3 rounded-lg bg-gray-50 dark:bg-gray-800 gap-2 sm:gap-0">
            <span className="font-medium text-sm sm:text-base">FFmpeg.wasm Ready:</span>
            <span className={`px-3 py-1.5 rounded-full text-xs sm:text-sm font-semibold text-center ${
              isEnvironmentReady 
                ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                : 'bg-error-100 text-error-700 dark:bg-error-900 dark:text-error-300'
            }`}>
              {isEnvironmentReady ? 'Yes ✅' : 'No ❌'}
            </span>
          </div>

          {!isEnvironmentReady && (
            <div className="p-4 rounded-lg bg-warning-100 dark:bg-warning-900 border border-warning-300 dark:border-warning-700">
              <div className="flex items-start space-x-2">
                <div className="text-warning-600 dark:text-warning-400 text-xl">⚠️</div>
                <div>
                  <p className="text-sm font-semibold text-warning-700 dark:text-warning-300 mb-1">
                    Environment Not Ready
                  </p>
                  <p className="text-sm text-warning-700 dark:text-warning-300">
                    Video conversion requires Cross-Origin Isolation and SharedArrayBuffer support. 
                    Please ensure your server is configured with the following headers:
                  </p>
                  <div className="mt-2 text-xs font-mono bg-warning-200 dark:bg-warning-800 p-2 rounded text-warning-800 dark:text-warning-200">
                    Cross-Origin-Embedder-Policy: require-corp<br/>
                    Cross-Origin-Opener-Policy: same-origin
                  </div>
                </div>
              </div>
            </div>
          )}

          {isEnvironmentReady && (
            <div className="p-4 rounded-lg bg-success-100 dark:bg-success-900 border border-success-300 dark:border-success-700">
              <div className="flex items-start space-x-2">
                <div className="text-success-600 dark:text-success-400 text-xl">✅</div>
                <div>
                  <p className="text-sm font-semibold text-success-700 dark:text-success-300 mb-1">
                    Environment Ready
                  </p>
                  <p className="text-sm text-success-700 dark:text-success-300">
                    Your browser is properly configured for video conversion. You can now upload and convert video files to MP3 format.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Audio Quality Settings */}
      <div className="card-mobile animate-fade-in">
        <div className="card-header">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
            Audio Quality Settings
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            Configure the output quality for your MP3 files
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {/* Bitrate Display */}
          <div className="p-3 sm:p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-700 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-purple-100 dark:bg-purple-800 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600 dark:text-purple-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Bitrate</h3>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600 dark:text-purple-300">128 kbps</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">High quality</p>
              </div>
            </div>
          </div>

          {/* Format Display */}
          <div className="p-3 sm:p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-700 rounded-lg">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-blue-100 dark:bg-blue-800 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 dark:text-blue-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 4V2a1 1 0 011-1h8a1 1 0 011 1v2m-9 4v10a2 2 0 002 2h6a2 2 0 002-2V8M9 8h6" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Format</h3>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600 dark:text-blue-300">MP3</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Universal compatibility</p>
              </div>
            </div>
          </div>

          {/* Processing Display */}
          <div className="p-3 sm:p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-700 rounded-lg sm:col-span-2 lg:col-span-1">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 dark:bg-green-800 rounded-lg flex items-center justify-center">
                  <svg className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 dark:text-green-300" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="font-medium text-sm sm:text-base text-gray-900 dark:text-gray-100">Processing</h3>
                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600 dark:text-green-300">Browser</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Local & private</p>
              </div>
            </div>
          </div>
        </div>

        {/* Settings Note */}
        <div className="mt-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            <strong>Note:</strong> Currently using optimized 128kbps MP3 encoding for the best balance of quality and file size. 
            All processing occurs locally in your browser for maximum privacy and security.
          </p>
        </div>
      </div>

      {/* File Upload Section */}
      <div className="card-mobile animate-slide-up">
        <div className="card-header">
          <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
            Video Upload & Conversion
          </h2>
          <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
            {isEnvironmentReady ? 'Upload your video files to start conversion' : 'Environment setup required before conversion'}
          </p>
        </div>

        {/* File Upload Component */}
        <FileUpload
          disabled={!isEnvironmentReady}
          onFilesSelected={fileUpload.handleFilesSelected}
          onFileRemove={fileUpload.handleFileRemove}
          maxFiles={10}
        />

        {/* Conversion Controls */}
        {fileUpload.files.length > 0 && (
          <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 sm:gap-0">
              <div className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
                {fileUpload.files.length} file(s) selected • {fileUpload.pendingFiles.length} ready to convert
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
                <button
                  onClick={fileUpload.clearFiles}
                  className="btn-secondary text-sm touch-target"
                  disabled={fileUpload.files.length === 0}
                >
                  Clear All
                </button>
                <button
                  onClick={handleStartConversion}
                  className="btn-primary text-sm touch-target"
                  disabled={!fileUpload.canStartConversion || videoConverter.isConverting}
                >
                  {videoConverter.isConverting ? 'Converting...' : 'Convert to MP3'}
                </button>
              </div>
            </div>

            {/* File Status Summary */}
            {(fileUpload.completedFiles.length > 0 || fileUpload.errorFiles.length > 0) && (
              <div className="mt-3 sm:mt-4 flex flex-wrap gap-2 sm:gap-4 text-xs sm:text-sm">
                {fileUpload.completedFiles.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400">
                    ✓ {fileUpload.completedFiles.length} completed
                  </span>
                )}
                {fileUpload.errorFiles.length > 0 && (
                  <span className="inline-flex items-center px-2 py-1 rounded-full bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400">
                    ✗ {fileUpload.errorFiles.length} failed
                  </span>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Conversion Progress */}
      {(videoConverter.isConverting || videoConverter.progress || videoConverter.results.length > 0) && (
        <div className="card animate-fade-in">
          <div className="card-header">
            <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
              Conversion Progress
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Track your video to MP3 conversion progress
            </p>
          </div>

          <ConversionProgress
            batchProgress={videoConverter.progress}
            currentFile={videoConverter.currentFile}
            results={videoConverter.results}
            isConverting={videoConverter.isConverting}
            canCancel={videoConverter.isConverting}
            isCancelling={false} // Add cancelling state if needed
            onCancel={videoConverter.cancel}
            variant="detailed"
            showFileDetails={true}
            showOverallProgress={true}
            showStats={true}
            animated={true}
            responsive={true}
          />
        </div>
      )}

      {/* Download Section */}
      {fileUpload.completedFiles.length > 0 && (
        <div className="card-mobile animate-fade-in">
          <div className="card-header">
            <h2 className="text-lg sm:text-xl font-bold text-gray-800 dark:text-gray-200">
              Download Converted Files
            </h2>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mt-1">
              Download your converted MP3 files individually or as a ZIP archive
            </p>
          </div>

          <div className="space-y-4">
            {/* Download Statistics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 p-3 sm:p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-blue-600 dark:text-blue-400">
                  {fileUpload.completedFiles.length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Files Ready</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-green-600 dark:text-green-400">
                  {(fileUpload.completedFiles.reduce((total, file) => 
                    total + (file.convertedData?.data.length || 0), 0) / (1024 * 1024)).toFixed(1)}MB
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Total Size</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-purple-600 dark:text-purple-400">
                  128k
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Bitrate</div>
              </div>
              <div className="text-center">
                <div className="text-xl sm:text-2xl font-bold text-orange-600 dark:text-orange-400">
                  MP3
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Format</div>
              </div>
            </div>

            {/* Individual File Downloads */}
            <div className="space-y-3 sm:space-y-4">
              <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                Individual Downloads
              </h3>
              <div className="space-y-2 sm:space-y-3 max-h-60 sm:max-h-80 overflow-y-auto hide-scrollbar smooth-scroll-mobile">
                {fileUpload.completedFiles.map((file) => (
                  <div 
                    key={file.id}
                    className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg hover:shadow-sm transition-all gap-3 sm:gap-0"
                  >
                    <div className="flex items-center space-x-2 sm:space-x-3 flex-1 min-w-0">
                      <div className="flex-shrink-0">
                        <svg className="h-5 w-5 text-green-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                          <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                          <path fillRule="evenodd" d="M4 5a2 2 0 012-2v1a1 1 0 102 0V3h8v1a1 1 0 102 0V3a2 2 0 012 2v6a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm2.5 5a1.5 1.5 0 100-3 1.5 1.5 0 000 3zm2.45 4a2.5 2.5 0 10-4.9 0h4.9z" clipRule="evenodd" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm sm:text-base font-medium text-gray-900 dark:text-gray-100 truncate">
                          {file.convertedData?.filename || `${file.name.replace(/\.[^/.]+$/, '')}.mp3`}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">
                          {file.convertedData && 
                            `${(file.convertedData.data.length / (1024 * 1024)).toFixed(2)} MB`
                          }
                        </p>
                      </div>
                    </div>
                    <div className="flex-shrink-0 w-full sm:w-auto">
                      <DownloadButton
                        singleFile={{
                          fileId: file.id,
                          originalFile: file.file,
                          convertedData: file.convertedData?.data || new Uint8Array(),
                          success: true,
                          processingTime: 0,
                          outputFormat: 'mp3',
                          bitrate: 128,
                          timestamp: new Date().toISOString()
                        }}
                        variant="outline"
                        size="sm"
                        showProgress={false}
                        className="w-full sm:w-auto touch-target"
                        icon={
                          <svg className="h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                        }
                      >
                        Download
                      </DownloadButton>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Batch Download */}
            {fileUpload.completedFiles.length > 1 && (
              <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-0">
                  <div className="flex-1">
                    <h3 className="text-sm sm:text-base font-semibold text-gray-700 dark:text-gray-300">
                      Download All Files
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Download all {fileUpload.completedFiles.length} files as a ZIP archive
                    </p>
                  </div>
                  <div className="w-full sm:w-auto">
                    <DownloadButton
                      uploadItems={fileUpload.completedFiles}
                      enableBatchDownload={true}
                      variant="primary"
                      size="md"
                      showProgress={true}
                      showFileCount={true}
                      className="w-full sm:w-auto touch-target"
                      batchDownloadOptions={{
                        archiveName: `video-to-mp3-${new Date().toISOString().slice(0, 10)}.zip`,
                        compression: 'fast'
                      }}
                      onDownloadStart={download.clearError}
                      onDownloadProgress={() => {
                        // Progress is handled internally by the component
                      }}
                      onDownloadComplete={(result) => {
                        console.log('Batch download complete:', result);
                      }}
                      onDownloadError={(error) => {
                        console.error('Batch download error:', error);
                      }}
                      icon={
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
                        </svg>
                      }
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Download Status */}
            {download.isDownloading && download.progress && (
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="animate-spin h-5 w-5 text-blue-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="m12 2 4 4-4 4V2z"></path>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-blue-900 dark:text-blue-100">
                      {download.progress && 'stage' in download.progress
                        ? `${(download.progress as any).stage === 'preparing' ? 'Preparing download...' :
                            (download.progress as any).stage === 'creating_archive' ? 'Creating ZIP archive...' :
                            'Downloading...'}`
                        : 'Downloading file...'
                      }
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Download Error */}
            {download.lastError && (
              <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-lg">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0">
                    <svg className="h-5 w-5 text-red-500" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-900 dark:text-red-100">
                      Download Failed
                    </p>
                    <p className="text-sm text-red-700 dark:text-red-300 mt-1">
                      {download.lastError.message}
                    </p>
                    <button
                      onClick={download.clearError}
                      className="text-xs text-red-600 dark:text-red-400 underline mt-2 hover:text-red-800 dark:hover:text-red-200"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default Converter