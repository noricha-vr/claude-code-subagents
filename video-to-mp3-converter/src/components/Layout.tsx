import type { ReactNode } from 'react'

interface LayoutProps {
  children: ReactNode
  currentPage?: 'home' | 'converter'
  onNavigateToHome?: () => void
  onNavigateToConverter?: () => void
}

interface HeaderProps {
  title?: string
  subtitle?: string
  currentPage?: 'home' | 'converter'
  onNavigateToHome?: () => void
  onNavigateToConverter?: () => void
}

interface FooterProps {
  showPoweredBy?: boolean
}

export const Header = ({ 
  title = "Video to MP3 Converter", 
  subtitle = "Convert your video files to high-quality MP3 audio format directly in your browser",
  currentPage = 'home',
  onNavigateToHome,
  onNavigateToConverter
}: HeaderProps) => {
  return (
    <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3 sm:py-4">
        {/* Navigation - レスポンシブ対応 */}
        <nav className="flex justify-between items-center mb-3 sm:mb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={onNavigateToHome}
              className="flex items-center space-x-2 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 transition-colors touch-target"
            >
              <svg className="w-6 h-6 sm:w-8 sm:h-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
              </svg>
              <span className="font-bold text-lg sm:text-xl">VideoMP3</span>
            </button>
          </div>
          
          <div className="flex items-center space-x-1 sm:space-x-2 lg:space-x-4">
            <button
              onClick={onNavigateToHome}
              className={`px-2 sm:px-3 lg:px-4 py-2 rounded-lg font-medium transition-all touch-target text-sm sm:text-base ${
                currentPage === 'home'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <span className="hidden sm:inline">Home</span>
              <svg className="w-4 h-4 sm:hidden" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </button>
            <button
              onClick={onNavigateToConverter}
              className={`px-2 sm:px-3 lg:px-4 py-2 rounded-lg font-medium transition-all flex items-center space-x-1 sm:space-x-2 touch-target text-sm sm:text-base ${
                currentPage === 'converter'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                  : 'text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20'
              }`}
            >
              <svg className="w-4 h-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span className="hidden sm:inline">Converter</span>
            </button>
          </div>
        </nav>
        
        {/* Title Section - only show on home page */}
        {currentPage === 'home' && (
          <div className="text-center max-w-4xl mx-auto px-2 sm:px-0">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent mb-2 sm:mb-3 leading-tight">
              {title}
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400 leading-relaxed">
              {subtitle}
            </p>
          </div>
        )}
        
        {/* Converter Page Header */}
        {currentPage === 'converter' && (
          <div className="text-center max-w-4xl mx-auto px-2 sm:px-0">
            <h1 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-gray-800 dark:text-gray-200 mb-2 leading-tight">
              Video Converter
            </h1>
            <p className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-gray-400">
              Upload and convert your videos to MP3 format
            </p>
          </div>
        )}
      </div>
    </header>
  )
}

export const Footer = ({ showPoweredBy = true }: FooterProps) => {
  return (
    <footer className="bg-gray-50 dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 mt-auto">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        <div className="text-center space-y-4 sm:space-y-6">
          {showPoweredBy && (
            <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              <span>Powered by</span>
              <div className="flex flex-wrap items-center justify-center gap-2 sm:gap-4">
                <span className="font-semibold text-blue-600 dark:text-blue-400">FFmpeg.wasm</span>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">React 18</span>
                <span className="text-gray-400 hidden sm:inline">•</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">TypeScript</span>
                <span className="text-gray-400 hidden lg:inline">•</span>
                <span className="font-semibold text-blue-600 dark:text-blue-400">TailwindCSS</span>
              </div>
            </div>
          )}
          
          <div className="flex flex-col sm:flex-row justify-center items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-500 dark:text-gray-400">
            <span>© 2024 Video to MP3 Converter</span>
            <span className="hidden sm:inline text-gray-300 dark:text-gray-600">•</span>
            <span className="text-center">Privacy-first • No uploads • Runs locally</span>
          </div>
          
          <div className="flex flex-wrap justify-center items-center gap-2 sm:gap-6 text-xs text-gray-400 dark:text-gray-500">
            <span>Chrome Browser Required</span>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
            <span>SharedArrayBuffer Support</span>
            <span className="text-gray-300 dark:text-gray-600 hidden sm:inline">•</span>
            <span>PWA Ready</span>
          </div>
        </div>
      </div>
    </footer>
  )
}

export const MainLayout = ({ children, currentPage, onNavigateToHome, onNavigateToConverter }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <Header 
        currentPage={currentPage}
        onNavigateToHome={onNavigateToHome}
        onNavigateToConverter={onNavigateToConverter}
      />
      <main className="flex-1 container mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 lg:py-8">
        <div className="max-w-7xl mx-auto">
          {children}
        </div>
      </main>
      <Footer />
    </div>
  )
}

export default MainLayout