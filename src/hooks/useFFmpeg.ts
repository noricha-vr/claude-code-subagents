import { useState, useCallback, useRef } from 'react';
import type { ConversionMessage, WorkerMessage } from '../workers/conversionWorker';

export interface ConversionState {
  isLoading: boolean;
  isConverting: boolean;
  progress: number;
  error: string | null;
  result: { data: Uint8Array; filename: string } | null;
}

export interface UseFFmpegReturn {
  state: ConversionState;
  convertFile: (file: File, outputName?: string) => Promise<void>;
  reset: () => void;
}

export function useFFmpeg(): UseFFmpegReturn {
  const [state, setState] = useState<ConversionState>({
    isLoading: false,
    isConverting: false,
    progress: 0,
    error: null,
    result: null
  });

  const workerRef = useRef<Worker | null>(null);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isConverting: false,
      progress: 0,
      error: null,
      result: null
    });
    
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
  }, []);

  const convertFile = useCallback(async (file: File, outputName?: string) => {
    reset();
    
    const finalOutputName = outputName || `${file.name.split('.')[0]}.mp3`;
    
    setState(prev => ({
      ...prev,
      isLoading: true,
      isConverting: true
    }));

    try {
      // Create new worker
      workerRef.current = new Worker(
        new URL('../workers/conversionWorker.ts', import.meta.url),
        { type: 'module' }
      );

      // Set up worker message handler
      workerRef.current.onmessage = (event: MessageEvent<WorkerMessage>) => {
        const message = event.data;
        
        switch (message.type) {
          case 'progress':
            setState(prev => ({
              ...prev,
              progress: message.progress,
              isLoading: message.progress < 100
            }));
            break;
            
          case 'success':
            setState(prev => ({
              ...prev,
              isLoading: false,
              isConverting: false,
              progress: 100,
              result: {
                data: message.data,
                filename: message.filename
              }
            }));
            break;
            
          case 'error':
            setState(prev => ({
              ...prev,
              isLoading: false,
              isConverting: false,
              error: message.message
            }));
            break;
        }
      };

      // Handle worker errors
      workerRef.current.onerror = (error) => {
        setState(prev => ({
          ...prev,
          isLoading: false,
          isConverting: false,
          error: `Worker error: ${error.message}`
        }));
      };

      // Send conversion task to worker
      const message: ConversionMessage = {
        type: 'convert',
        file,
        outputName: finalOutputName
      };
      
      workerRef.current.postMessage(message);
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConverting: false,
        error: error instanceof Error ? error.message : 'Failed to start conversion'
      }));
    }
  }, [reset]);

  return {
    state,
    convertFile,
    reset
  };
}