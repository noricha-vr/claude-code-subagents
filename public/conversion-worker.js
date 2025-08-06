// FFmpeg Conversion Worker
import { FFmpeg } from 'https://unpkg.com/@ffmpeg/ffmpeg@0.12.15/dist/esm/index.js';
import { fetchFile, toBlobURL } from 'https://unpkg.com/@ffmpeg/util@0.12.2/dist/esm/index.js';

let ffmpeg = null;

async function initializeFFmpeg() {
  if (ffmpeg) return;

  ffmpeg = new FFmpeg();
  
  // Set up progress callback
  ffmpeg.on('progress', ({ progress }) => {
    postMessage({
      type: 'progress',
      progress: Math.round(progress * 100)
    });
  });

  // Load FFmpeg core from CDN
  const baseURL = 'https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd';
  
  await ffmpeg.load({
    coreURL: await toBlobURL(`${baseURL}/ffmpeg-core.js`, 'text/javascript'),
    wasmURL: await toBlobURL(`${baseURL}/ffmpeg-core.wasm`, 'application/wasm'),
    workerURL: await toBlobURL(`${baseURL}/ffmpeg-core.worker.js`, 'text/javascript')
  });
}

async function convertToMP3(file, outputName) {
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
    const data = await ffmpeg.readFile(outputName);
    
    // Clean up files
    await ffmpeg.deleteFile(inputName);
    await ffmpeg.deleteFile(outputName);

    // Send success message
    postMessage({
      type: 'success',
      data,
      filename: outputName
    });
  } catch (error) {
    postMessage({
      type: 'error',
      message: error.message || 'Conversion failed'
    });
  }
}

// Listen for messages from the main thread
addEventListener('message', async (event) => {
  const { type, file, outputName } = event.data;

  if (type === 'convert') {
    try {
      await initializeFFmpeg();
      await convertToMP3(file, outputName);
    } catch (error) {
      postMessage({
        type: 'error',
        message: error.message || 'Worker initialization failed'
      });
    }
  }
});