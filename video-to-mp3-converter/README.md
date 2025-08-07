# Video to MP3 Converter

A powerful web application that converts video files to MP3 audio format directly in your browser using FFmpeg.wasm. No server upload required - all processing happens locally in your browser for maximum privacy and speed.

## ✨ Features

- **Browser-based conversion** - No server uploads, complete privacy
- **Multiple format support** - Convert MP4, AVI, MOV, WebM, and more to MP3
- **Drag & drop interface** - Easy file upload with visual feedback
- **Real-time progress** - Track conversion progress with detailed status
- **High-quality audio** - 128kbps MP3 output with excellent quality
- **PWA support** - Install as a desktop/mobile app, works offline
- **Cross-origin isolation** - Optimized for performance with SharedArrayBuffer

## 🚀 Quick Start

### Prerequisites

- Modern browser (Chrome recommended for best performance)
- Bun package manager (recommended) or Node.js 18+

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd video-to-mp3-converter

# Install dependencies
bun install

# Start development server
bun run dev
```

### Production Build

```bash
# Type check, lint, and build for production
bun run build:prod

# Preview production build
bun run preview
```

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript 5
- **Build Tool**: Vite 7
- **Styling**: TailwindCSS 4
- **Video Processing**: FFmpeg.wasm 0.12
- **PWA**: Workbox + Vite Plugin PWA
- **Package Manager**: Bun

## 📱 PWA Features

- **Offline Support** - Works without internet connection after first load
- **Install Prompt** - Add to home screen on mobile/desktop
- **Auto Updates** - Seamlessly updates when new versions are available
- **Background Sync** - Continue conversions even when minimized

## 🔧 Browser Compatibility

### Required Features
- **SharedArrayBuffer** support (Chrome 68+, Firefox 72+, Safari 15.2+)
- **Web Workers** support
- **Cross-Origin Isolation** headers

### Recommended
- **Chrome 100+** for optimal performance
- **4GB+ RAM** for large video files
- **Modern hardware** for faster conversion

## 📐 Architecture

```
src/
├── components/          # React components
│   ├── ConversionProgress.tsx
│   ├── FileUpload.tsx
│   ├── DownloadButton.tsx
│   └── ...
├── hooks/              # Custom React hooks
│   ├── useVideoConverter.ts
│   ├── useFFmpegWorker.ts
│   └── ...
├── utils/              # Utility functions
│   ├── converter.ts
│   ├── fileValidation.ts
│   └── ...
├── workers/            # Web Workers
│   └── ffmpeg.worker.ts
└── sw.ts               # Service Worker
```

## 🚀 Deployment

### Vercel

```bash
# Using Vercel CLI
vercel --prod

# Or connect your GitHub repository to Vercel dashboard
```

### Netlify

```bash
# Using Netlify CLI
netlify deploy --prod --dir=dist

# Or drag & drop dist folder to Netlify dashboard
```

### Important Deployment Notes

Both platforms are pre-configured with:
- **Cross-Origin Isolation** headers for SharedArrayBuffer support
- **Caching strategies** for optimal performance
- **SPA routing** support for React Router

## 🔒 Security & Privacy

- **Client-side only** - No files are uploaded to any server
- **Cross-origin isolation** - Enhanced security boundaries
- **No tracking** - No analytics or data collection
- **Open source** - Transparent and auditable code

## 📊 Performance

- **Code splitting** - Optimized bundle loading
- **Web Workers** - Non-blocking UI during conversion
- **Lazy loading** - Components loaded on demand
- **Aggressive caching** - Fast subsequent loads

## 🛠 Development

### Scripts

```bash
bun run dev          # Development server
bun run build        # Production build
bun run build:prod   # Production build with checks
bun run preview      # Preview production build
bun run lint         # ESLint check
bun run type-check   # TypeScript type checking
```

### Environment Setup

The app requires Cross-Origin Isolation headers for SharedArrayBuffer support:

```
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Opener-Policy: same-origin
```

These are automatically configured in development and deployment configs.

## 📝 File Size Limits

- **Recommended**: Up to 100MB video files
- **Maximum**: Limited by browser memory (typically 500MB-2GB)
- **Performance**: Smaller files convert faster

## 🐛 Known Issues & Limitations

- Chrome-only optimization (other browsers supported but slower)
- Large files (>500MB) may cause memory issues
- Some exotic video codecs may not be supported
- Mobile browsers have stricter memory limits

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📞 Support

- **Issues**: Use GitHub Issues for bug reports
- **Discussions**: Use GitHub Discussions for questions
- **Email**: [Your contact email]

---

Built with ❤️ using React, TypeScript, and FFmpeg.wasm