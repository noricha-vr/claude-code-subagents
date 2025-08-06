import { useState, useCallback } from 'react';
import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

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

export function useFFmpegSimple(): UseFFmpegReturn {
  const [state, setState] = useState<ConversionState>({
    isLoading: false,
    isConverting: false,
    progress: 0,
    error: null,
    result: null
  });

  const [ffmpeg] = useState(() => {
    const instance = new FFmpeg();
    
    // Set up progress callback
    instance.on('progress', ({ progress }) => {
      setState(prev => ({
        ...prev,
        progress: Math.round(progress * 100)
      }));
    });
    
    return instance;
  });

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      isConverting: false,
      progress: 0,
      error: null,
      result: null
    });
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
      // Load FFmpeg if not already loaded
      if (!ffmpeg.loaded) {
        const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
        
        await ffmpeg.load({
          coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
          wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
          workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
        });
      }

      // Write input file to FFmpeg virtual filesystem
      const inputName = file.name;
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Execute conversion command
      await ffmpeg.exec([
        '-i', inputName,
        '-vn', // Disable video
        '-ar', '44100', // Audio sample rate
        '-ac', '2', // Audio channels (stereo)
        '-b:a', '192k', // Audio bitrate
        finalOutputName
      ]);

      // Read the output file
      const data = await ffmpeg.readFile(finalOutputName) as Uint8Array;
      
      // Clean up files
      await ffmpeg.deleteFile(inputName);
      await ffmpeg.deleteFile(finalOutputName);

      setState(prev => ({
        ...prev,
        isLoading: false,
        isConverting: false,
        progress: 100,
        result: {
          data,
          filename: finalOutputName
        }
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConverting: false,
        error: error instanceof Error ? error.message : 'Conversion failed'
      }));
    }
  }, [ffmpeg, reset]);

  return {
    state,
    convertFile,
    reset
  };
}