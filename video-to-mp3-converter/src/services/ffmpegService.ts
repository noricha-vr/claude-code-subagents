import { FFmpeg } from '@ffmpeg/ffmpeg'
import { toBlobURL, fetchFile } from '@ffmpeg/util'
import { ConversionProgress, ConversionResult, VideoFile, ConversionOptions } from '../types'

export class FFmpegService {
  private ffmpeg: FFmpeg | null = null
  private isLoaded = false
  private isLoading = false
  private onProgress?: (progress: ConversionProgress) => void

  constructor() {
    this.ffmpeg = new FFmpeg()
  }

  setProgressCallback(callback: (progress: ConversionProgress) => void) {
    this.onProgress = callback
  }

  private updateProgress(phase: ConversionProgress['phase'], progress: number, message: string, eta?: number) {
    if (this.onProgress) {
      this.onProgress({
        phase,
        progress,
        message,
        eta
      })
    }
  }

  async load(): Promise<void> {
    if (this.isLoaded || this.isLoading || !this.ffmpeg) {
      return
    }

    this.isLoading = true
    this.updateProgress('loading', 10, 'FFmpegコアライブラリを読み込み中...')

    try {
      // Load FFmpeg WebAssembly files
      const coreURL = await toBlobURL('/ffmpeg-core.js', 'text/javascript')
      const wasmURL = await toBlobURL('/ffmpeg-core.wasm', 'application/wasm')
      const workerURL = await toBlobURL('/ffmpeg-core.worker.js', 'text/javascript')

      this.updateProgress('loading', 30, 'FFmpegライブラリを初期化中...')

      await this.ffmpeg.load({
        coreURL,
        wasmURL,
        workerURL
      })

      this.updateProgress('loading', 60, 'FFmpeg設定を構成中...')

      // Set up logging
      this.ffmpeg.on('log', ({ message }) => {
        console.log('[FFmpeg]', message)
      })

      // Set up progress monitoring
      this.ffmpeg.on('progress', ({ progress, time }) => {
        if (this.onProgress) {
          const percentage = Math.round(progress * 100)
          const eta = time > 0 ? Math.max(0, (100 - percentage) * (time / percentage)) : undefined
          this.updateProgress('converting', percentage, '動画をMP3に変換中...', eta)
        }
      })

      this.isLoaded = true
      this.updateProgress('loading', 100, 'FFmpeg読み込み完了')
    } catch (error) {
      console.error('FFmpeg load error:', error)
      this.updateProgress('error', 0, 'FFmpegライブラリの読み込みに失敗しました')
      throw new Error('FFmpegの読み込みに失敗しました: ' + (error instanceof Error ? error.message : String(error)))
    } finally {
      this.isLoading = false
    }
  }

  async convert(
    videoFile: VideoFile,
    options: ConversionOptions = { bitrate: 128, quality: 'standard' }
  ): Promise<ConversionResult> {
    if (!this.ffmpeg || !this.isLoaded) {
      throw new Error('FFmpegが読み込まれていません')
    }

    const startTime = Date.now()
    
    try {
      this.updateProgress('converting', 0, '変換処理を開始しています...')

      // Write input file to FFmpeg filesystem
      const inputFileName = 'input.' + this.getFileExtension(videoFile.name)
      const outputFileName = 'output.mp3'

      this.updateProgress('converting', 5, 'ファイルを準備中...')
      await this.ffmpeg.writeFile(inputFileName, await fetchFile(videoFile.file))

      this.updateProgress('converting', 10, '変換パラメータを設定中...')

      // Build FFmpeg command
      const command = this.buildConversionCommand(inputFileName, outputFileName, options)
      
      console.log('FFmpeg command:', command.join(' '))

      this.updateProgress('converting', 15, '変換を実行中...')

      // Execute conversion
      await this.ffmpeg.exec(command)

      this.updateProgress('converting', 90, '変換結果を処理中...')

      // Read output file
      const data = await this.ffmpeg.readFile(outputFileName)
      
      // Create blob from converted data (handle FileData type)
      const blob = new Blob([data as BlobPart], { type: 'audio/mpeg' })
      const outputFileName_clean = videoFile.name.replace(/\.[^/.]+$/, '.mp3')

      // Clean up
      await this.ffmpeg.deleteFile(inputFileName)
      await this.ffmpeg.deleteFile(outputFileName)

      const duration = (Date.now() - startTime) / 1000

      this.updateProgress('complete', 100, '変換が完了しました！')

      return {
        success: true,
        blob,
        fileName: outputFileName_clean,
        duration
      }
    } catch (error) {
      console.error('Conversion error:', error)
      const errorMessage = error instanceof Error ? error.message : String(error)
      
      this.updateProgress('error', 0, '変換中にエラーが発生しました')
      
      return {
        success: false,
        error: errorMessage,
        duration: (Date.now() - startTime) / 1000
      }
    }
  }

  private buildConversionCommand(
    inputFile: string, 
    outputFile: string, 
    options: ConversionOptions
  ): string[] {
    const command = [
      '-i', inputFile,          // Input file
      '-vn',                    // No video output
      '-acodec', 'libmp3lame',  // Use MP3 codec
      '-ab', `${options.bitrate}k`, // Audio bitrate
      '-ar', '44100',           // Sample rate
      '-ac', '2',               // Stereo channels
    ]

    // Add quality settings
    if (options.quality === 'high') {
      command.push('-q:a', '0')  // Highest quality
    } else {
      command.push('-q:a', '4')  // Standard quality
    }

    // Add metadata if provided
    if (options.metadata) {
      if (options.metadata.title) {
        command.push('-metadata', `title=${options.metadata.title}`)
      }
      if (options.metadata.artist) {
        command.push('-metadata', `artist=${options.metadata.artist}`)
      }
      if (options.metadata.album) {
        command.push('-metadata', `album=${options.metadata.album}`)
      }
    }

    // Overwrite output file if it exists
    command.push('-y')
    command.push(outputFile)

    return command
  }

  private getFileExtension(fileName: string): string {
    const parts = fileName.split('.')
    return parts.length > 1 ? parts.pop() || 'mp4' : 'mp4'
  }

  async terminate(): Promise<void> {
    if (this.ffmpeg && this.isLoaded) {
      try {
        await this.ffmpeg.terminate()
        console.log('FFmpeg terminated successfully')
      } catch (error) {
        console.warn('Error terminating FFmpeg:', error)
      } finally {
        this.isLoaded = false
        this.ffmpeg = null
      }
    }
  }

  isReady(): boolean {
    return this.isLoaded && this.ffmpeg !== null
  }

  getVersion(): string {
    return '@ffmpeg/ffmpeg 0.12.10'
  }
}