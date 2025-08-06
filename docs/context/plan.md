# 実行計画

## 全体目標
FFmpeg.wasmを使用してブラウザ内で動画ファイルをMP3音声ファイルに変換するPWA対応ウェブアプリケーション
- React 18 + TypeScript + Vite + TailwindCSS
- Chrome専用（SharedArrayBuffer対応）
- 128kbps固定のMP3変換
- PWA対応でオフライン動作

## Phase構造

### Phase 1: プロジェクト初期設定とコア基盤（8 Steps）
- [ ] Step 1.1: Viteプロジェクト作成とbun設定（package.json, vite.config.ts - 20行）
- [ ] Step 1.2: TypeScript設定とTailwindCSS初期化（tsconfig.json, tailwind.config.js - 15行）
- [ ] Step 1.3: 型定義ファイル作成（types/index.ts - 25行）
- [ ] Step 1.4: プロジェクト構造の基本ディレクトリ作成とindex.html更新（index.html - 18行）
- [ ] Step 1.5: Cross-Origin Isolation設定（vite.config.ts更新 - 12行）
- [ ] Step 1.6: FFmpeg.wasm依存関係追加とWorker設定（package.json, worker設定 - 10行）
- [ ] Step 1.7: React App.tsx基本構造作成（src/App.tsx - 25行）
- [ ] Step 1.8: 基本レイアウトコンポーネント作成（src/components/Layout.tsx - 20行）

### Phase 2: UI実装とコンポーネント構築（7 Steps）
- [ ] Step 2.1: FileUploader コンポーネント作成（src/components/FileUploader.tsx - 30行）
- [ ] Step 2.2: FileInfo 表示コンポーネント作成（src/components/FileInfo.tsx - 20行）
- [ ] Step 2.3: ConversionProgress コンポーネント作成（src/components/ConversionProgress.tsx - 25行）
- [ ] Step 2.4: ConversionButton コンポーネント作成（src/components/ConversionButton.tsx - 15行）
- [ ] Step 2.5: DownloadButton コンポーネント作成（src/components/DownloadButton.tsx - 18行）
- [ ] Step 2.6: ErrorDisplay コンポーネント作成（src/components/ErrorDisplay.tsx - 20行）
- [ ] Step 2.7: Header コンポーネント作成（src/components/Header.tsx - 12行）

### Phase 3: FFmpeg.wasm統合と変換機能実装（6 Steps）
- [ ] Step 3.1: FFmpeg Worker作成（src/workers/ffmpeg.worker.ts - 30行）
- [ ] Step 3.2: FFmpegService クラス作成（src/services/FFmpegService.ts - 28行）
- [ ] Step 3.3: ConversionState管理Hook作成（src/hooks/useConversion.ts - 25行）
- [ ] Step 3.4: ファイル変換ロジック実装（src/utils/conversion.ts - 22行）
- [ ] Step 3.5: エラーハンドリング機能実装（src/utils/errorHandler.ts - 20行）
- [ ] Step 3.6: メモリ管理ユーティリティ作成（src/utils/memoryManager.ts - 18行）

### Phase 4: PWA対応とService Worker設定（5 Steps）
- [ ] Step 4.1: PWA manifest.json作成（public/manifest.json - 20行）
- [ ] Step 4.2: Service Worker作成（public/sw.js - 25行）
- [ ] Step 4.3: PWAアイコン設定とWorkbox設定（vite.config.ts更新 - 15行）
- [ ] Step 4.4: オフライン検出機能実装（src/hooks/useOffline.ts - 18行）
- [ ] Step 4.5: PWA更新通知機能実装（src/components/UpdateNotification.tsx - 22行）

### Phase 5: テストと最終調整（4 Steps）
- [ ] Step 5.1: メインApp統合とState連携（src/App.tsx更新 - 30行）
- [ ] Step 5.2: スタイリング調整とレスポンシブ対応（src/styles/index.css - 25行）
- [ ] Step 5.3: エラー境界とフォールバック実装（src/components/ErrorBoundary.tsx - 20行）
- [ ] Step 5.4: プロダクションビルド設定とテスト実行（vite.config.ts最終調整 - 12行）

## 現在の実行ステップ: Step 1.1

### ファイル
`package.json`, `vite.config.ts`

### 変更内容（20行以内）
```json
// package.json - bunを使用したプロジェクト初期設定
{
  "name": "video-to-mp3-converter",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "tsc && vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.43",
    "@types/react-dom": "^18.2.17",
    "@vitejs/plugin-react": "^4.2.1",
    "typescript": "^5.2.2",
    "vite": "^5.0.8"
  }
}
```

```typescript
// vite.config.ts - 基本設定
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173
  }
})
```

### レビューチェックポイント
- [ ] bunパッケージマネージャーの正しい設定確認
- [ ] TypeScript設定の妥当性確認
- [ ] Vite設定の基本構成確認
- [ ] セキュリティ要件（Cross-Origin Isolation準備）確認