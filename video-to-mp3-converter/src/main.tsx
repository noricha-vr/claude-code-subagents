import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Set up error logging in development
if (process.env.NODE_ENV === 'development') {
  // Enhanced error logging for development
  window.addEventListener('error', (event) => {
    console.group('🚨 Global Error Caught')
    console.error('Error:', event.error)
    console.error('Message:', event.message)
    console.error('Filename:', event.filename)
    console.error('Line:', event.lineno, 'Column:', event.colno)
    console.groupEnd()
  })

  window.addEventListener('unhandledrejection', (event) => {
    console.group('🚨 Unhandled Promise Rejection')
    console.error('Reason:', event.reason)
    console.error('Promise:', event.promise)
    console.groupEnd()
  })
}

const rootElement = document.getElementById('root')
if (!rootElement) {
  throw new Error('Root element not found. Please ensure there is a div with id="root" in your HTML.')
}

createRoot(rootElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
