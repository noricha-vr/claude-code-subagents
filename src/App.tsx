import { useState } from 'react';

function App() {
  const [count, setCount] = useState(0);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-900 mb-8">
          Video to MP3 Converter
        </h1>
        <p className="text-lg text-gray-600 mb-4">
          Convert video files to MP3 directly in your browser
        </p>
        <div className="bg-white p-6 rounded-lg shadow-lg">
          <p className="text-sm text-gray-500 mb-4">Development Environment Setup Complete</p>
          <button
            onClick={() => setCount((count) => count + 1)}
            className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors"
          >
            Count is {count}
          </button>
        </div>
      </div>
    </div>
  );
}

export default App;