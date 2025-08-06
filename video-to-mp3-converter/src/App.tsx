import { useState, useCallback, useEffect } from 'react'
import FileUpload from './components/FileUpload'
import ConversionProgress from './components/ConversionProgress'
import ErrorMessage from './components/ErrorMessage'
import Header from './components/Header'
import Footer from './components/Footer'
import { VideoFile, ConversionResult } from './types'
import { useFFmpeg } from './hooks/useFFmpeg'
import { useErrorHandler } from './hooks/useErrorHandler'
import { logSystemInfo, checkSystemCapabilities, getCompatibilityIssues } from './utils/systemCheck'

function App() {
  const [selectedFile, setSelectedFile] = useState<VideoFile | null>(null)
  const [result, setResult] = useState<ConversionResult | null>(null)
  
  const { 
    isReady, 
    progress, 
    loadFFmpeg, 
    convertVideo, 
    reset: resetFFmpeg,
    workerAvailable
  } = useFFmpeg()
  
  const { 
    errors, 
    removeError, 
    clearErrors,
    handleGenericError 
  } = useErrorHandler()

  // System compatibility check on mount
  useEffect(() => {
    logSystemInfo()
    
    const capabilities = checkSystemCapabilities()
    const issues = getCompatibilityIssues(capabilities)
    
    if (issues.length > 0) {
      console.warn('Compatibility issues detected:', issues)
      handleGenericError(
        new Error(`互換性の問題が検出されました: ${issues.join(', ')}`),
        'compatibility'
      )
    }
  }, [handleGenericError])

  const handleFileSelect = useCallback(async (file: VideoFile) => {
    setSelectedFile(file)
    clearErrors()
    setResult(null)
    resetFFmpeg()
    
    // Auto-initialize FFmpeg when file is selected
    try {
      await loadFFmpeg()
    } catch (error) {
      console.error('Failed to auto-initialize FFmpeg:', error)
    }
  }, [clearErrors, resetFFmpeg, loadFFmpeg])

  const handleConversionStart = useCallback(async () => {
    if (!selectedFile) return

    try {
      clearErrors()
      setResult(null)

      // Ensure FFmpeg is loaded before conversion
      if (!isReady) {
        await loadFFmpeg()
      }

      // Start conversion immediately
      const conversionResult = await convertVideo(selectedFile, {
        bitrate: 128,
        quality: 'standard'
      })

      setResult(conversionResult)

      if (!conversionResult.success && conversionResult.error) {
        handleGenericError(new Error(conversionResult.error), 'conversion')
      }
    } catch (error) {
      console.error('Conversion process error:', error)
      handleGenericError(
        error instanceof Error ? error : new Error(String(error)),
        'conversion-process'
      )
    }
  }, [selectedFile, isReady, loadFFmpeg, convertVideo, clearErrors, handleGenericError])

  const handleDownload = useCallback(() => {
    if (!result?.blob) return
    
    const url = URL.createObjectURL(result.blob)
    const a = document.createElement('a')
    a.href = url
    a.download = result.fileName || 'converted.mp3'
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [result])

  const handleReset = useCallback(() => {
    setSelectedFile(null)
    setResult(null)
    clearErrors()
    resetFFmpeg()
  }, [clearErrors, resetFFmpeg])

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <Header />
      
      <main className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-gray-800 mb-4 text-shadow">
              Video to MP3 Converter
            </h1>
            <p className="text-gray-600 text-lg">
              ブラウザで動画ファイルをMP3に変換できます。ファイルはあなたのデバイス上で処理され、サーバーにアップロードされることはありません。
            </p>
          </div>

          <div className="space-y-6">
            {errors.map((error, index) => (
              <ErrorMessage
                key={`${error.timestamp.getTime()}-${index}`}
                message={error.message}
                onDismiss={() => removeError(index)}
                type="error"
              />
            ))}

            {!workerAvailable && (
              <ErrorMessage
                message="Web Workersがサポートされていないか、利用できません。一部の機能が制限される可能性があります。"
                type="warning"
                autoHide={false}
              />
            )}

            <div className="card">
              <h2 className="text-xl font-semibold text-gray-800 mb-4">
                ステップ1: ファイルを選択
              </h2>
              <FileUpload onFileSelect={handleFileSelect} selectedFile={selectedFile} />
            </div>

            {selectedFile && (
              <div className="card">
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  ステップ2: 変換
                </h2>
                <ConversionProgress
                  progress={progress}
                  onStart={handleConversionStart}
                  onReset={handleReset}
                  result={result}
                  onDownload={handleDownload}
                />
              </div>
            )}
          </div>

          <div className="mt-12 text-center text-sm text-gray-500">
            <p>
              サポートされている形式: MP4, AVI, MOV, MKV, WebM, その他多数
            </p>
            <p className="mt-2">
              出力形式: MP3 (128kbps)
            </p>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  )
}

export default App