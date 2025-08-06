import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Check for SharedArrayBuffer support
if (typeof SharedArrayBuffer === 'undefined') {
  console.warn(
    'SharedArrayBuffer is not available. This may be due to missing Cross-Origin Isolation headers. ' +
    'FFmpeg.wasm may not work properly. Please ensure your server is configured with the following headers:\n' +
    'Cross-Origin-Embedder-Policy: require-corp\n' +
    'Cross-Origin-Opener-Policy: same-origin'
  )
} else {
  console.log('SharedArrayBuffer is available. FFmpeg.wasm should work properly.')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)