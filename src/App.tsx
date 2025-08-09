import { type FC } from 'react';
import { useConversion } from './hooks';
import { FileUploader, ConversionProgress, DownloadButton } from './components';
import { PWAInstallButton } from './components/PWAInstallButton';
import { NetworkStatus } from './components/NetworkStatus';
import { ConversionStatus } from './types';

/**
 * Video to MP3 Converter Application
 * 
 * Web application to convert video files to MP3 in the browser
 * Complete client-side processing using FFmpeg.wasm
 * 
 * Features:
 * - Drag & drop file selection
 * - Real-time conversion progress display
 * - MP3 file download
 * - Cross-Origin Isolation environment support
 */
const App: FC = () => {
  const conversion = useConversion();


  // Conversion start handler
  const handleStartConversion = () => {
    if (conversion.canConvert) {
      conversion.convertToMp3();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      {/* Network status display */}
      <NetworkStatus />

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <div className="text-center">
            <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
              Video to MP3 Converter
            </h1>
            <p className="text-gray-600 text-sm md:text-base mb-4">
              Convert video files to MP3 directly in your browser - No server upload required
            </p>
            
            {/* PWA install button */}
            <div className="flex justify-center">
              <PWAInstallButton />
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="space-y-8">
          
          {/* File upload area */}
          <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
            <div className="mb-6">
              <h2 className="text-xl font-semibold text-gray-800 mb-2">
                Step 1: Select Video File
              </h2>
              <p className="text-gray-600 text-sm">
                Choose a video file to convert to MP3 format (128kbps)
              </p>
            </div>
            
            <FileUploader conversion={conversion} />

            {/* Conversion button after file selection */}
            {conversion.state.videoFile && conversion.status === ConversionStatus.IDLE && (
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

          {/* Conversion progress area */}
          {(conversion.status === ConversionStatus.LOADING || 
            conversion.status === ConversionStatus.PROCESSING) && (
            <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
              <div className="mb-6">
                <h2 className="text-xl font-semibold text-gray-800 mb-2">
                  Step 2: Conversion Progress
                </h2>
                <p className="text-gray-600 text-sm">
                  Monitor the conversion process in real-time
                </p>
              </div>
              
              <ConversionProgress
                status={conversion.status}
                progress={conversion.state.progress?.percentage || 0}
                currentStep={conversion.state.progress?.currentStep || ''}
                estimatedTimeRemaining={conversion.state.progress?.estimatedTimeLeft || 0}
                fileName={conversion.state.videoFile?.name}
              />
            </div>
          )}

          {/* Download area */}
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
              
              <DownloadButton conversionReturn={conversion} />

              {/* Convert another file button */}
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

          {/* Error display */}
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

      {/* Footer */}
      <footer className="mt-16 pb-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <div className="bg-white/50 rounded-xl p-6 text-sm text-gray-600">
            <p className="mb-2">
              <span className="font-medium">✨ Features:</span> PWA enabled • Browser-only processing • No server upload • 
              Cross-Origin Isolation enabled • FFmpeg.wasm powered • Offline support
            </p>
            <p className="text-xs text-gray-500 mb-2">
              Best experience on Chrome with hardware acceleration enabled
            </p>
            <p className="text-xs text-gray-500">
              Install this app for offline usage and better performance
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;