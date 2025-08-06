import { FFmpeg } from '@ffmpeg/ffmpeg';
import { fetchFile, toBlobURL } from '@ffmpeg/util';

interface ConversionMessage {
  type: 'convert';
  file: File;
  outputName: string;
}

interface ProgressMessage {
  type: 'progress';
  progress: number;
}

interface SuccessMessage {
  type: 'success';
  data: Uint8Array;
  filename: string;
}

interface ErrorMessage {
  type: 'error';
  message: string;
}

type WorkerMessage = ProgressMessage | SuccessMessage | ErrorMessage;

let ffmpeg: FFmpeg | null = null;

async function initializeFFmpeg(): Promise<void> {
  if (ffmpeg) return;

  ffmpeg = new FFmpeg();
  
  // Set up progress callback
  ffmpeg.on('progress', ({ progress }) => {
    const message: ProgressMessage = {
      type: 'progress',
      progress: Math.round(progress * 100)
    };
    postMessage(message);
  });

  // Load FFmpeg core from local files to avoid CORS issues
  const baseURL = '/ffmpeg-core';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
  });
}

async function convertToMP3(file: File, outputName: string): Promise<void> {
  if (!ffmpeg) {
    throw new Error('FFmpeg not initialized');
  }

  try {
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
      outputName
    ]);

    // Read the output file
    const data = await ffmpeg.readFile(outputName) as Uint8Array;
    
    // Clean up files
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Send success message
    const successMessage: SuccessMessage = {
      type: 'success',
      data,
      filename: outputName
    };
    postMessage(successMessage);
  } catch (error) {
    const errorMessage: ErrorMessage = {
      type: 'error',
      message: error instanceof Error ? error.message : 'Conversion failed'
    };
    postMessage(errorMessage);
  }
}

// Listen for messages from the main thread
addEventListener('message', async (event: MessageEvent<ConversionMessage>) => {
  const { type, file, outputName } = event.data;

  if (type === 'convert') {
    try {
      await initializeFFmpeg();
      await convertToMP3(file, outputName);
    } catch (error) {
      const errorMessage: ErrorMessage = {
        type: 'error',
        message: error instanceof Error ? error.message : 'Worker initialization failed'
      };
      postMessage(errorMessage);
    }
  }
});

export type { ConversionMessage, WorkerMessage };