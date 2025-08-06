import { useEffect } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import ConversionProgress from './components/ConversionProgress';
import DownloadButton from './components/DownloadButton';
import ErrorDisplay from './components/ErrorDisplay';
import ErrorBoundary from './components/ErrorBoundary';
import InstallPrompt from './components/InstallPrompt';
import { useFFmpegSimple as useFFmpeg } from './hooks/useFFmpegSimple';
import { useConversionState } from './hooks/useConversionState';
import { ConversionProgress as ConversionProgressType, AudioFile, ConversionResult } from './types';

function App() {
  // Use custom hooks for state management
  const conversionState = useConversionState();
  const ffmpeg = useFFmpeg();

  // Create AudioFile from conversion result
  const audioFile: AudioFile | null = conversionState.result ? {
    blob: conversionState.result.audioBlob,
    name: conversionState.result.filename,
    size: conversionState.result.size,
    url: URL.createObjectURL(conversionState.result.audioBlob)
  } : null;

  // Create progress object for existing components
  const progress: ConversionProgressType = {
    stage: conversionState.isConverting ? 'converting' : 
           conversionState.result ? 'complete' : 
           conversionState.error ? 'error' : 'idle',
    percentage: conversionState.progress,
    message: conversionState.isConverting ? 'Converting video to MP3...' : 
             conversionState.result ? 'Conversion completed!' : 
             conversionState.error ? conversionState.error.message : ''
  };

  // Handle FFmpeg state changes
  useEffect(() => {
    if (ffmpeg.state.error) {
      conversionState.setError({
        type: 'conversion',
        message: ffmpeg.state.error
      });
    } else if (ffmpeg.state.result) {
      // Convert FFmpeg result to ConversionResult
      const audioBlob = new Blob([ffmpeg.state.result.data as BlobPart], { type: 'audio/mp3' });
      const result: ConversionResult = {
        audioBlob,
        filename: ffmpeg.state.result.filename,
        size: audioBlob.size
      };
      conversionState.setResult(result);
    }
  }, [ffmpeg.state.error, ffmpeg.state.result, conversionState.setError, conversionState.setResult]);

  // Sync progress
  useEffect(() => {
    if (ffmpeg.state.isConverting) {
      conversionState.setProgress(ffmpeg.state.progress);
    }
  }, [ffmpeg.state.progress, ffmpeg.state.isConverting, conversionState.setProgress]);

  const handleFileSelect = async (file: File) => {
    conversionState.setSelectedFile(file);
    conversionState.clearError();
    
    // Validate file type
    if (!file.type.startsWith('video/')) {
      conversionState.setError({
        type: 'validation',
        message: 'Please select a valid video file'
      });
      return;
    }

    try {
      conversionState.setConverting(true);
      await ffmpeg.convertFile(file);
    } catch (error) {
      conversionState.setError({
        type: 'conversion',
        message: error instanceof Error ? error.message : 'Conversion failed'
      });
    }
  };

  const handleErrorDismiss = () => {
    conversionState.clearError();
  };

  const isConverting = conversionState.isConverting;

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-100">
        <Header />
        
        <main className="container mx-auto py-8 px-4">
          <div className="max-w-2xl mx-auto space-y-6">
            <FileUploader 
              onFileSelect={handleFileSelect}
              disabled={isConverting}
            />
            
            {conversionState.selectedFile && (
              <div className="bg-white rounded-lg shadow-md p-4">
                <h3 className="font-medium text-gray-800 mb-2">Selected File:</h3>
                <p className="text-sm text-gray-600">{conversionState.selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  Size: {(conversionState.selectedFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
            )}
            
            <ConversionProgress progress={progress} />
            
            <DownloadButton 
              audioFile={audioFile} 
              disabled={isConverting}
            />
            
            <ErrorDisplay 
              error={conversionState.error} 
              onDismiss={handleErrorDismiss}
            />
          </div>
        </main>
        
        <InstallPrompt />
      </div>
    </ErrorBoundary>
  );
}

export default App;