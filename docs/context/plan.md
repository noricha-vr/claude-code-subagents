# 実行計画：動画→MP3変換ウェブアプリケーション

## 全体目標
FFmpeg.wasmを使用してブラウザ内で動画ファイルをMP3音声ファイルに変換するPWA対応ウェブアプリケーションを構築する

## Phase構造

### Phase 1: プロジェクト基盤構築（6 Steps）
- [ ] Step 1.1: Viteプロジェクト作成とbun設定（package.json, vite.config.ts - 25行）
- [ ] Step 1.2: TypeScript設定とTailwindCSS初期化（tsconfig.json, tailwind.config.js - 30行）
- [ ] Step 1.3: TypeScript型定義ファイル作成（src/types/index.ts - 20行）
- [ ] Step 1.4: 基本的なReactアプリ構造作成（src/main.tsx, src/App.tsx - 20行）
- [ ] Step 1.5: TailwindCSS基本スタイル設定（src/index.css - 15行）
- [ ] Step 1.6: 開発環境確認とビルドテスト（確認作業のみ）

### Phase 2: ✅ 完了 - UI基盤コンポーネント（7 Steps）
- [x] Step 2.1: Headerコンポーネント作成（src/components/Header.tsx - 15行）
- [x] Step 2.2: FileUploaderコンポーネント作成（src/components/FileUploader.tsx - 56行）
- [x] Step 2.3: ファイル選択・ドラッグ&ドロップ機能実装（useFileDrop.ts追加 - 44行）
- [x] Step 2.4: ConversionProgressコンポーネント作成（src/components/ConversionProgress.tsx - 53行）
- [x] Step 2.5: DownloadButtonコンポーネント作成（src/components/DownloadButton.tsx - 53行）
- [x] Step 2.6: ErrorDisplayコンポーネント作成（src/components/ErrorDisplay.tsx - 56行）
- [x] Step 2.7: メインレイアウト統合（src/App.tsx修正 - 72行）

### Phase 3: FFmpeg統合とコア機能（8 Steps）
- [ ] Step 3.1: FFmpeg.wasm依存関係追加（package.json修正 - 5行）
- [ ] Step 3.2: FFmpegServiceクラス作成（src/services/FFmpegService.ts - 30行）
- [ ] Step 3.3: Web Worker作成（src/workers/ffmpeg-worker.ts - 25行）
- [ ] Step 3.4: 状態管理フック作成（src/hooks/useConversion.ts - 30行）
- [ ] Step 3.5: ファイル検証ユーティリティ作成（src/utils/fileValidation.ts - 20行）
- [ ] Step 3.6: エラーハンドリングユーティリティ作成（src/utils/errorHandler.ts - 25行）
- [ ] Step 3.7: 変換機能統合（src/App.tsx修正 - 20行）
- [ ] Step 3.8: Cross-Origin Isolation対応（vite.config.ts修正 - 10行）

### Phase 4: PWA機能実装（5 Steps）
- [ ] Step 4.1: PWA Manifest作成（public/manifest.json - 20行）
- [ ] Step 4.2: Service Worker作成（public/service-worker.js - 30行）
- [ ] Step 4.3: PWAアイコンセット準備（public/icons/複数ファイル）
- [ ] Step 4.4: Vite PWAプラグイン設定（vite.config.ts修正 - 15行）
- [ ] Step 4.5: PWAインストール促進UI追加（src/components/PWAPrompt.tsx - 25行）

### Phase 5: 品質向上とテスト（6 Steps）
- [ ] Step 5.1: テストデータディレクトリ作成（movies/ディレクトリとサンプル動画）
- [ ] Step 5.2: E2Eテスト準備（playwright.config.ts - 20行）
- [ ] Step 5.3: 基本機能テスト作成（tests/conversion.spec.ts - 30行）
- [ ] Step 5.4: エラーハンドリングテスト作成（tests/error-handling.spec.ts - 25行）
- [ ] Step 5.5: パフォーマンス最適化（複数ファイル修正 - 20行）
- [ ] Step 5.6: アクセシビリティ対応（src/components/複数ファイル修正 - 15行）

### Phase 6: 最終統合とデプロイ準備（4 Steps）
- [ ] Step 6.1: 本番ビルド設定最適化（vite.config.ts修正 - 10行）
- [ ] Step 6.2: 統合テスト実行と動作確認（テスト実行のみ）
- [ ] Step 6.3: ドキュメント作成（README.md, docs/USAGE.md - 25行）
- [ ] Step 6.4: 最終動作確認とリリース準備（確認作業のみ）

## Phase 1: ✅ 完了 - プロジェクト基盤構築（6 Steps）
- [x] Step 1.1: Viteプロジェクト作成とbun設定
- [x] Step 1.2: TypeScript設定とTailwindCSS初期化
- [x] Step 1.3: TypeScript型定義ファイル作成
- [x] Step 1.4: 基本的なReactアプリ構造作成
- [x] Step 1.5: TailwindCSS基本スタイル設定
- [x] Step 1.6: 開発環境確認とビルドテスト

## 現在の実行ステップ: Step 2.2

### ファイル
`src/components/FileUploader.tsx`

### 変更内容（30行以内）
```typescript
// src/components/FileUploader.tsx
import React, { useRef } from 'react';
import { FileUploadProps } from '../types';

const FileUploader: React.FC<FileUploadProps> = ({ 
  onFileSelect, 
  acceptedFormats = "video/*", 
  disabled = false 
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div 
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          disabled 
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed' 
            : 'border-blue-400 hover:border-blue-600 hover:bg-blue-50'
        }`}
        onClick={!disabled ? handleClick : undefined}
      >
        <div className="mb-4">
          <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-lg font-medium text-gray-700">
          {disabled ? 'Converting...' : 'Click to select video file'}
        </p>
        <p className="text-sm text-gray-500 mt-1">
          Supported formats: MP4, MOV, AVI, WebM
        </p>
      </div>
      
      <input
        ref={fileInputRef}
        type="file"
        accept={acceptedFormats}
        onChange={handleFileChange}
        className="hidden"
        disabled={disabled}
      />
    </div>
  );
};

export default FileUploader;
```

### レビューチェックポイント
- [ ] FileUploaderコンポーネントの作成確認
- [ ] ファイル選択機能の実装確認
- [ ] TailwindCSSスタイリング適用確認
- [ ] TypeScript Props型定義確認

## 実装順序の根拠
1. **Phase 1**: 開発環境とツールチェーンの確立
2. **Phase 2**: UI基盤を先に構築し、後の統合を容易にする
3. **Phase 3**: コア機能実装（FFmpeg統合）
4. **Phase 4**: PWA機能追加
5. **Phase 5**: 品質保証とテスト
6. **Phase 6**: 最終統合と本番準備

## 技術的制約と注意点
- SharedArrayBuffer使用のためCross-Origin Isolation必須
- Chrome専用（SharedArrayBuffer対応要件）
- FFmpeg.wasmの大容量ファイル（約30MB）考慮
- メモリ効率的な処理実装が必要
- Web Workerでの非同期処理必須

## 成功基準
- [ ] /movies/ディレクトリの動画ファイルをブラウザで選択・変換できる
- [ ] 変換したMP3ファイルをダウンロード・再生できる
- [ ] PWAとしてインストール・オフライン動作可能
- [ ] エラーハンドリングが適切に機能する
- [ ] Playwright MCPテストで動作検証完了