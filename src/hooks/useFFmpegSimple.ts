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
        console.log('Loading FFmpeg from local files...');
        const baseURL = '/ffmpeg-core';
        
        try {
          // Try to load without multithreading first
          console.log('Attempting to load single-threaded FFmpeg...');
          await ffmpeg.load({
            coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
            wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm')
          });
          
          console.log('FFmpeg loaded successfully (single-threaded)');
        } catch (loadError) {
          console.error('Single-threaded load failed, retrying with basic configuration:', loadError);
          try {
            // Fallback to basic load
            await ffmpeg.load();
            console.log('FFmpeg loaded with default configuration');
          } catch (fallbackError) {
            console.error('All FFmpeg load attempts failed:', fallbackError);
            throw new Error(`FFmpeg loading failed: ${fallbackError}`);
          }
        }
      }

      // Write input file to FFmpeg virtual filesystem
      const inputName = file.name;
      console.log(`Writing input file: ${inputName} (${file.size} bytes)`);
      await ffmpeg.writeFile(inputName, await fetchFile(file));

      // Execute conversion command
      console.log('Starting conversion...');
      const conversionCommand = [
        '-i', inputName,
        '-vn', // Disable video
        '-ar', '44100', // Audio sample rate
        '-ac', '2', // Audio channels (stereo)
        '-b:a', '192k', // Audio bitrate
        finalOutputName
      ];
      console.log('FFmpeg command:', conversionCommand.join(' '));
      
      await ffmpeg.exec(conversionCommand);
      
      console.log('Conversion completed, reading output file...');
      // Read the output file
      const data = await ffmpeg.readFile(finalOutputName) as Uint8Array;
      console.log(`Output file size: ${data.length} bytes`);
      
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
      console.error('Conversion error:', error);
      const errorMessage = error instanceof Error 
        ? `${error.message} (${error.name})` 
        : 'Unknown conversion error';
      console.error('Detailed error:', errorMessage);
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        isConverting: false,
        error: errorMessage
      }));
    }
  }, [ffmpeg, reset]);

  return {
    state,
    convertFile,
    reset
  };
}