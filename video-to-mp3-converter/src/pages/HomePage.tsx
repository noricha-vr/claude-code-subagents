import { useApp } from '../context/AppContext'

interface HomePageProps {
  onNavigateToConverter?: () => void
  showDemoFeatures?: boolean
}

const HomePage = ({ onNavigateToConverter, showDemoFeatures = false }: HomePageProps) => {
  const { state } = useApp()
  
  // Use global state instead of local state for environment checks
  const isEnvironmentReady = state.environment.crossOriginIsolated && state.environment.sharedArrayBufferSupported

  return (
    <div className="space-y-6 sm:space-y-8 lg:space-y-12">
      {/* Hero Section */}
      <div className="text-center space-y-4 sm:space-y-6 lg:space-y-8 animate-fade-in px-4 sm:px-0">
        <div className="space-y-3 sm:space-y-4">
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl xl:text-7xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-blue-800 bg-clip-text text-transparent leading-tight">
            Video to MP3 Converter
          </h1>
          <p className="text-base sm:text-lg md:text-xl lg:text-2xl text-gray-600 dark:text-gray-300 max-w-4xl mx-auto leading-relaxed px-2 sm:px-0">
            Convert your video files to high-quality MP3 audio format directly in your browser
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 lg:gap-6 justify-center items-center">
          <button
            onClick={onNavigateToConverter}
            className="btn-primary text-base sm:text-lg px-6 sm:px-8 py-3 sm:py-4 flex items-center space-x-2 sm:space-x-3 group w-full sm:w-auto touch-target"
            disabled={!isEnvironmentReady}
          >
            <svg className="w-5 h-5 sm:w-6 sm:h-6 group-hover:scale-110 transition-transform" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
            <span className="truncate">{isEnvironmentReady ? 'Start Converting' : 'Environment Setup Required'}</span>
          </button>
          
          {isEnvironmentReady && (
            <div className="flex items-center space-x-2 text-sm sm:text-base text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 px-3 py-2 rounded-full">
              <svg className="w-4 h-4 sm:w-5 sm:h-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span>Environment Ready</span>
            </div>
          )}
        </div>
      </div>

      {/* Environment Status Quick Check */}
      {!isEnvironmentReady && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <h2 className="text-xl font-bold text-red-600 dark:text-red-400">
              Environment Setup Required
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Your browser environment needs configuration for video conversion
            </p>
          </div>

          <div className="p-4 rounded-lg bg-warning-100 dark:bg-warning-900 border border-warning-300 dark:border-warning-700">
            <div className="flex items-start space-x-2">
              <div className="text-warning-600 dark:text-warning-400 text-xl">⚠️</div>
              <div>
                <p className="text-sm font-semibold text-warning-700 dark:text-warning-300 mb-2">
                  Cross-Origin Isolation Required
                </p>
                <p className="text-sm text-warning-700 dark:text-warning-300 mb-3">
                  Video conversion requires Cross-Origin Isolation and SharedArrayBuffer support. 
                  Please ensure your server is configured with the following headers:
                </p>
                <div className="text-xs font-mono bg-warning-200 dark:bg-warning-800 p-2 rounded text-warning-800 dark:text-warning-200 mb-3">
                  Cross-Origin-Embedder-Policy: require-corp<br/>
                  Cross-Origin-Opener-Policy: same-origin
                </div>
                <p className="text-sm text-warning-700 dark:text-warning-300">
                  Status: Cross-Origin Isolated: {state.environment.crossOriginIsolated ? '✅' : '❌'}, 
                  SharedArrayBuffer: {state.environment.sharedArrayBufferSupported ? '✅' : '❌'}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Features Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 animate-slide-up px-4 sm:px-0">
        {[
          {
            title: 'Browser-Based Processing',
            description: 'All conversion happens locally in your browser. No server uploads required.',
            icon: '🌐',
            status: isEnvironmentReady ? 'ready' : 'pending',
            details: 'FFmpeg.wasm technology enables full video processing in the browser'
          },
          {
            title: 'High-Quality Audio',
            description: 'Convert videos to 128kbps MP3 format with excellent audio quality.',
            icon: '🎵',
            status: 'ready',
            details: 'Professional-grade audio encoding with configurable bitrate settings'
          },
          {
            title: 'Privacy & Security',
            description: 'Your files never leave your device. Complete privacy guaranteed.',
            icon: '🔒',
            status: 'ready',
            details: 'Zero data transmission - everything processed locally for maximum security'
          }
        ].map((feature, index) => (
          <div key={index} className={`card-mobile text-center transition-all duration-300 ${
            feature.status === 'ready' ? 'hover:scale-105 hover:shadow-lg' : 'opacity-75'
          } sm:col-span-1 ${index === 2 ? 'sm:col-span-2 lg:col-span-1' : ''}`} style={{ animationDelay: `${index * 0.1}s` }}>
            <div className="text-3xl sm:text-4xl mb-3 sm:mb-4">{feature.icon}</div>
            <h4 className="font-semibold mb-2 text-base sm:text-lg">{feature.title}</h4>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">
              {feature.description}
            </p>
            <p className="text-xs sm:text-sm text-gray-500 dark:text-gray-500 mb-3 leading-relaxed">
              {feature.details}
            </p>
            <div className={`inline-flex items-center px-2 sm:px-3 py-1 rounded-full text-xs sm:text-sm font-medium ${
              feature.status === 'ready' 
                ? 'bg-success-100 text-success-700 dark:bg-success-900 dark:text-success-300'
                : 'bg-warning-100 text-warning-700 dark:bg-warning-900 dark:text-warning-300'
            }`}>
              {feature.status === 'ready' ? '✅ Ready' : '⚠️ Pending'}
            </div>
          </div>
        ))}
      </div>

      {/* Technical Specifications */}
      <div className="card animate-slide-up">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Technical Specifications
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Advanced features and capabilities
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Supported Formats */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-200">Input Formats</h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-3 xl:grid-cols-4 gap-2">
              {['MP4', 'AVI', 'MOV', 'MKV', 'WMV', 'FLV', 'WEBM', 'M4V', '3GP'].map(format => (
                <div key={format} className="text-xs sm:text-sm bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 px-2 py-1.5 sm:py-2 rounded text-center font-mono">
                  {format}
                </div>
              ))}
            </div>
          </div>

          {/* Output Quality */}
          <div className="space-y-3">
            <h3 className="font-medium text-sm sm:text-base text-gray-800 dark:text-gray-200">Output Quality</h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Bitrate:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">128 kbps</span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Sample Rate:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">44.1 kHz</span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Channels:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">Stereo</span>
              </div>
              <div className="flex justify-between items-center text-sm sm:text-base">
                <span className="text-gray-600 dark:text-gray-400">Format:</span>
                <span className="font-medium text-purple-600 dark:text-purple-400">MP3</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="card animate-slide-up">
        <div className="card-header">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            How It Works
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Simple 3-step conversion process
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 sm:gap-4 lg:gap-6">
          {[
            {
              step: '1',
              title: 'Upload Videos',
              description: 'Drag & drop or select video files from your device',
              icon: '📁'
            },
            {
              step: '2', 
              title: 'Convert to MP3',
              description: 'Click convert to process your videos locally in the browser',
              icon: '⚙️'
            },
            {
              step: '3',
              title: 'Download Audio',
              description: 'Download individual MP3 files or get them all in a ZIP archive',
              icon: '⬇️'
            }
          ].map((step, index) => (
            <div key={index} className="text-center space-y-3 sm:space-y-4">
              <div className="relative mb-2">
                <div className="w-12 h-12 sm:w-14 sm:h-14 lg:w-16 lg:h-16 mx-auto bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-base sm:text-lg touch-target">
                  {step.step}
                </div>
                <div className="absolute -bottom-1 sm:-bottom-2 left-1/2 transform -translate-x-1/2 text-xl sm:text-2xl">
                  {step.icon}
                </div>
              </div>
              <h4 className="font-semibold text-sm sm:text-base text-gray-800 dark:text-gray-200">{step.title}</h4>
              <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400 leading-relaxed px-2 sm:px-0">{step.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Demo Features Section */}
      {showDemoFeatures && (
        <div className="card animate-slide-up">
          <div className="card-header">
            <h3 className="text-lg font-semibold">Development Demo</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Testing UI components and interactions
            </p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {/* Button Demo */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Button Components</h4>
              <div className="space-y-2">
                <button className="btn-primary w-full text-sm">Primary Button</button>
                <button className="btn-secondary w-full text-sm">Secondary Button</button>
                <div className="grid grid-cols-2 gap-2">
                  <button className="btn-success text-xs">Success</button>
                  <button className="btn-error text-xs">Error</button>
                </div>
              </div>
            </div>

            {/* Form Demo */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">Form Components</h4>
              <div className="space-y-2">
                <input 
                  type="text" 
                  placeholder="Text input..." 
                  className="form-input w-full text-sm"
                />
                <select className="form-input w-full text-sm">
                  <option>Select option...</option>
                  <option>Option 1</option>
                  <option>Option 2</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default HomePage