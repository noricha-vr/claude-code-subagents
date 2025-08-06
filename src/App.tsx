import React, { useState } from 'react';
import Header from './components/Header';
import FileUploader from './components/FileUploader';
import ConversionProgress from './components/ConversionProgress';
import DownloadButton from './components/DownloadButton';
import ErrorDisplay from './components/ErrorDisplay';
import { ConversionProgress as ConversionProgressType, AudioFile, AppError } from './types';

function App() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [audioFile, setAudioFile] = useState<AudioFile | null>(null);
  const [progress, setProgress] = useState<ConversionProgressType>({
    stage: 'idle',
    percentage: 0,
    message: '',
  });
  const [error, setError] = useState<AppError | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setAudioFile(null);
    setProgress({ stage: 'idle', percentage: 0, message: '' });
    
    // TODO: FFmpeg変換処理を実装（Phase 3で追加予定）
    console.log('Selected file:', file.name, file.size, file.type);
  };

  const handleErrorDismiss = () => {
    setError(null);
  };

  const isConverting = progress.stage === 'loading' || progress.stage === 'converting';

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      
      <main className="container mx-auto py-8 px-4">
        <div className="max-w-2xl mx-auto space-y-6">
          <FileUploader 
            onFileSelect={handleFileSelect}
            disabled={isConverting}
          />
          
          {selectedFile && (
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="font-medium text-gray-800 mb-2">Selected File:</h3>
              <p className="text-sm text-gray-600">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                Size: {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          )}
          
          <ConversionProgress progress={progress} />
          
          <DownloadButton 
            audioFile={audioFile} 
            disabled={isConverting}
          />
          
          <ErrorDisplay 
            error={error} 
            onDismiss={handleErrorDismiss}
          />
        </div>
      </main>
    </div>
  );
}

export default App;