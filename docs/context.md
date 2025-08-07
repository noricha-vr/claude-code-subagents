# ワークフローコンテキスト - 動画→MP3変換ウェブアプリ

## 📍 現在の状態
- フェーズ: 計画作成完了
- ステップ: 1/25
- 最終更新: 2025-01-08 12:00
- プロジェクト: video-converter

## 🎯 プロジェクト概要
React 18 + TypeScript + Vite + TailwindCSS を使用した動画からMP3への変換ウェブアプリケーション
- FFmpeg.wasmによるブラウザ内変換（128kbps固定）
- ドラッグ&ドロップ対応
- PWA・オフライン対応
- bunパッケージマネージャー使用

## 📋 実装計画

### Phase 1: プロジェクト基盤構築 (Step 1-5)

#### Step 1: プロジェクト初期化
- ファイル: `video-converter/package.json`
- 作業: Vite + React + TypeScript プロジェクトの初期化、依存関係追加
- 依存関係: react, typescript, vite, tailwindcss, @ffmpeg/ffmpeg, @ffmpeg/util
- 完了: [ ]

#### Step 2: Vite設定
- ファイル: `video-converter/vite.config.ts`
- 作業: PWA対応、WASM対応、開発サーバー設定
- 完了: [ ]

#### Step 3: TailwindCSS設定
- ファイル: `video-converter/tailwind.config.js`, `video-converter/src/index.css`
- 作業: TailwindCSSの初期設定とカスタムスタイル
- 完了: [ ]

#### Step 4: TypeScript設定
- ファイル: `video-converter/tsconfig.json`
- 作業: strict mode、パス解決、FFmpeg型定義の設定
- 完了: [ ]

#### Step 5: プロジェクト構造作成
- ファイル: `video-converter/src/` ディレクトリ構造
- 作業: components, services, types, utils ディレクトリ作成
- 完了: [ ]

### Phase 2: 型定義とコアサービス (Step 6-10)

#### Step 6: 型定義作成
- ファイル: `video-converter/src/types/index.ts`
- 作業: File, ConversionStatus, Progress, Error 型の定義
- 完了: [ ]

#### Step 7: FFmpegService基本構造
- ファイル: `video-converter/src/services/ffmpeg.ts`
- 作業: FFmpeg.wasmのロード、初期化処理
- 完了: [ ]

#### Step 8: ファイルバリデーション
- ファイル: `video-converter/src/utils/fileValidator.ts`
- 作業: 対応形式チェック、ファイルサイズ制限
- 完了: [ ]

#### Step 9: エラーハンドリング
- ファイル: `video-converter/src/utils/errorHandler.ts`
- 作業: エラー分類、ユーザーフレンドリーメッセージ
- 完了: [ ]

#### Step 10: プログレス計算
- ファイル: `video-converter/src/utils/progressCalculator.ts`
- 作業: 変換進捗の計算ロジック
- 完了: [ ]

### Phase 3: UIコンポーネント開発 (Step 11-17)

#### Step 11: メインアプリコンポーネント
- ファイル: `video-converter/src/App.tsx`
- 作業: レイアウト、状態管理、コンポーネント統合
- 完了: [ ]

#### Step 12: FileUploaderコンポーネント
- ファイル: `video-converter/src/components/FileUploader.tsx`
- 作業: ドラッグ&ドロップ、ファイル選択UI
- 完了: [ ]

#### Step 13: ConversionProgressコンポーネント
- ファイル: `video-converter/src/components/ConversionProgress.tsx`
- 作業: プログレスバー、ステータス表示
- 完了: [ ]

#### Step 14: FileInfoコンポーネント
- ファイル: `video-converter/src/components/FileInfo.tsx`
- 作業: ファイル詳細表示、変換設定
- 完了: [ ]

#### Step 15: DownloadButtonコンポーネント
- ファイル: `video-converter/src/components/DownloadButton.tsx`
- 作業: 変換後ファイルのダウンロード機能
- 完了: [ ]

#### Step 16: ErrorDisplayコンポーネント
- ファイル: `video-converter/src/components/ErrorDisplay.tsx`
- 作業: エラーメッセージ表示、再試行機能
- 完了: [ ]

#### Step 17: レスポンシブデザイン調整
- ファイル: `video-converter/src/components/*.tsx`
- 作業: モバイル・タブレット対応のスタイル調整
- 完了: [ ]

### Phase 4: 変換機能実装 (Step 18-20)

#### Step 18: FFmpeg変換処理
- ファイル: `video-converter/src/services/ffmpeg.ts`
- 作業: 動画→MP3変換ロジック、進捗コールバック
- 完了: [ ]

#### Step 19: WebWorker統合
- ファイル: `video-converter/src/workers/conversionWorker.ts`
- 作業: メインスレッドをブロックしない変換処理
- 完了: [ ]

#### Step 20: バッチ処理対応
- ファイル: `video-converter/src/services/batchProcessor.ts`
- 作業: 複数ファイルの順次変換処理
- 完了: [ ]

### Phase 5: PWA・オフライン対応 (Step 21-23)

#### Step 21: Service Worker
- ファイル: `video-converter/public/sw.js`
- 作業: アプリとFFmpegのキャッシュ、オフライン対応
- 完了: [ ]

#### Step 22: PWAマニフェスト
- ファイル: `video-converter/public/manifest.json`
- 作業: アプリメタデータ、アイコン設定
- 完了: [ ]

#### Step 23: PWA登録
- ファイル: `video-converter/src/main.tsx`
- 作業: Service Worker登録、インストールプロンプト
- 完了: [ ]

### Phase 6: テスト・最適化 (Step 24-25)

#### Step 24: テストファイル作成
- ファイル: `video-converter/src/__tests__/`
- 作業: 主要コンポーネントの単体テスト
- 完了: [ ]

#### Step 25: パフォーマンス最適化
- ファイル: `video-converter/src/`
- 作業: コード分割、メモリ最適化、バンドルサイズ削減
- 完了: [ ]

## 🔨 実装結果
*実装はまだ開始されていません*

## 👁️ レビュー結果
*レビューはまだ実施されていません*

## ➡️ 次のアクション
Step 1: プロジェクト初期化から開始してください