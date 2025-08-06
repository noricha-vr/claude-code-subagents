import React from 'react'

const Footer: React.FC = () => {
  return (
    <footer className="bg-white border-t border-gray-200 mt-16">
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-2">
              Video to MP3 Converter
            </h3>
            <p className="text-gray-600 text-sm">
              完全にブラウザ内で動作するプライベートで安全な動画変換ツール
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-6">
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">プライバシー保護</h4>
              <p className="text-sm text-gray-600">
                ファイルはあなたのデバイス上でのみ処理され、サーバーに送信されることはありません
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">高速変換</h4>
              <p className="text-sm text-gray-600">
                WebAssembly版FFmpegを使用した高速で効率的な変換処理
              </p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-800 mb-2">多形式対応</h4>
              <p className="text-sm text-gray-600">
                MP4、AVI、MOV、MKVなど、主要な動画形式をサポート
              </p>
            </div>
          </div>

          <div className="border-t border-gray-200 pt-4">
            <p className="text-xs text-gray-500">
              © 2024 Video to MP3 Converter. Powered by{' '}
              <a
                href="https://ffmpegwasm.netlify.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 underline"
              >
                FFmpeg.wasm
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  )
}

export default Footer